# Known Issues & Fixes

A running log of non-obvious problems hit during development and how they were resolved.

---

## 2026-07-20 — `npm run dev -w server` crashes on boot (env not loaded)

**Symptoms**
- `PORT=8081 npm run dev -w server` exits immediately with a Zod config error:
  `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` = `Required` / `undefined`.
  Meanwhile `server/.env` clearly has those keys, and `npm run migrate`/`seed`/`test` work fine.

**Root cause**
The `dev` script was `tsx watch src/index.ts` — it never loaded `server/.env`. Only the
`migrate`/`seed` scripts (`node --env-file=.env …`) and the vitest setup loaded env, so the
long-running dev server was the one command that booted with an empty environment and failed
`config.ts`'s `Env.parse(process.env)`.

**Fix**
Changed the dev script to load env explicitly (tsx passes Node's `--env-file` through):
`"dev": "tsx watch --env-file=.env src/index.ts"`. `PORT` still comes from the inline shell
var. Adding a real `ANTHROPIC_API_KEY` to `server/.env` and restarting now picks it up too.

---

## 2026-07-20 — `npm run build -w server` fails (TS6059) but `npm run test` is green (Spec 1)

**Symptoms**
- Full vitest suite passes (24 files / 69 tests green), but `npm run build -w server` fails:
  `src/services/seedContent.test.ts(4,51): error TS6059: File '.../server/supabase/seed.ts'
  is not under 'rootDir' 'server/src'`.
- A moved test then failed to import `./seed.js` even after the path was correct.

**Root cause**
Two independent traps, both around `server/supabase/`:
1. **tsc vs vitest disagree on `rootDir`.** `server/tsconfig.json` is `{ rootDir: "src", include: ["src"] }`.
   A test placed **inside `src/`** that imports **outside `src/`** (`src/services/seedContent.test.ts`
   → `../../supabase/seed.ts`) makes `tsc` pull a file outside `rootDir` into the build → TS6059.
   **vitest never catches this** — it compiles per-file with esbuild and ignores `rootDir`. So a green
   `npm run test` does NOT prove `npm run build` passes. The pre-existing `supabase/seed.test.ts` avoids
   the trap by living in `supabase/` (outside `include: ["src"]`, so `tsc` skips it; vitest still runs it).
2. **Stray in-place tsc output shadows source imports.** Loose `server/supabase/seed.js` + `seed.d.ts`
   (compiled artifacts, NOT under `dist/`) were sitting next to `seed.ts`. Node/tsc resolved the stale
   `./seed.js` instead of `seed.ts`. The build uses `outDir: dist`, so any `.js`/`.d.ts` next to a `.ts`
   source in this (pure-TS) tree is always stray. `.gitignore`'s `dist/` does not catch in-place output.

**Fix**
- Put tests that import from `supabase/` **in `supabase/`** (next to `seed.test.ts`), not in `src/`.
  Moved `seedContent.test.ts` → `server/supabase/seedContent.test.ts` and fixed its relative imports
  (`../src/db/client.js`, `../src/testutils/db.js`, `./seed.js`).
- Deleted the stray `server/supabase/seed.js` + `seed.d.ts`, and added a `.gitignore` guard
  (`server/supabase/*.js`, `server/supabase/*.d.ts`) so in-place compiles can't be committed or shadow imports.

**Rule to keep it fixed:** when finishing a server increment, run `npm run build -w server` (the `tsc`
gate) — not just `npm run test`. vitest green ≠ tsc green.

---

## 2026-07-19 — Dependency audit (during Slice 2) — drift & landmines

Found while adding the delivery-pipeline libs. None were live bugs; recorded so they
don't turn into one.

**Dual `zod` majors (latent).** `node_modules/zod@3.x` (used by `shared` + `server`) vs
`web/node_modules/zod@4.x` (was declared in `web`). Currently inert because `web/src`
imports neither `zod` nor `@tp/types` at runtime, so the "two zod instances" clash can't
fire. **Rule to keep it inert:** web must not import a `@tp/types` Zod *schema* and call
`.parse()` on it; if web ever needs zod, add `zod@^3` (match `shared`), not v4.
- **Action taken:** removed the unused `zod` from `web/package.json` (verified zero usage:
  no imports, no `z.` calls, no react-hook-form/resolvers). Re-add as `^3` if needed later.

**`shared` build relied on a hoisted TypeScript.** `shared`'s `build` runs `tsc` but it had
no `typescript` devDependency — it only worked because npm hoisted TS from `server`/`web`.
- **Action taken:** added `"typescript": "^5.5.0"` to `shared/devDependencies` (explicit,
  matches `server`).

**TypeScript major drift (noted, not fixed).** `web` uses `~6.0.2`; `server`/`shared` use
`^5.5.0`. Different typecheck semantics per workspace — revisit if it causes friction.

**Node pin drift (minor).** `.nvmrc` pins `20`; dev machine runs `v22` (`engines` says
`>=20`, so allowed). Harmless; the pin is just stale.

**`npm audit` noise is dev-only.** The advisories (incl. 1 critical) live in the
`vitest → vite → esbuild` dev chain. `npm audit --omit=dev` reports **0** in production
deps. Not shippable risk; a `vitest` major bump would clear them.

**`tsc` on `server` is slow (jimp's large type graph + the iCloud stall below).** A cold
`npm run build -w server` can take minutes on this machine. If it *hangs* (no CPU), it's the
iCloud offload issue below — reinstall. If it's just slow-but-progressing, let it finish.

---

## 2026-07-18 — Builds/git/servers hang for minutes (iCloud offloads `node_modules`)

**Symptoms**
- `tsc -b`, `vite build`, `npm run build` hang indefinitely (process idle at ~0% CPU, no output).
- `git commit` / `git status` / `git log` intermittently fail with
  `fatal: mmap failed: Operation timed out` or `could not open '.git/COMMIT_EDITMSG': Operation timed out`.
- The Express API server won't finish booting (never logs "server listening").
- Meanwhile trivial ops work fine: `echo > file`, `git rev-parse`, and a single-file `cat` are instant.

**Root cause (proven with `sample` + `lsof`)**
The repo lives under `~/Desktop`, which is iCloud-synced. macOS **"Optimize Mac Storage"**
silently offloads infrequently-used files inside `node_modules`, leaving on-disk stubs.
When a tool reads an offloaded file, macOS tries to re-download it on demand and the
`read()` syscall **blocks forever** (stack: `node::fs::Read → uv_fs_read → read`). A single
file reads fine; reading the whole dependency set hits an offloaded one and stalls the
entire build/boot.

It is **not** memory pressure (32% free while hung), **not** `tsc` itself (a trivial
`/tmp` compile takes 3.5s), and **not** fixed by `--skipLibCheck` (tsc still reads the
files to resolve modules) or by killing the iCloud `bird` daemon (that makes reads worse).

**Fix (immediate, ~15s)**
```bash
rm -rf node_modules web/node_modules server/node_modules shared/node_modules
npm install
```
Fresh install writes real local files → reads stop stalling. Afterward `tsc -b` and
`vite build` each run in ~2s.

**Fix (durable — prevents recurrence)**
- System Settings → [Apple ID] → iCloud → **turn OFF "Optimize Mac Storage"** so files
  never offload, **or**
- Move the repo to a non-synced path (e.g. `~/dev/transportation-platform`): copy the
  project **without** `node_modules`, then `npm install` at the destination.

**Workarounds while it's happening**
- Prefer direct binaries (`node_modules/.bin/tsc`, `.bin/vite`) over `npx` / `npm run -w`
  (the npm-exec wrapper adds its own hang here).
- Retry git — it usually succeeds once I/O frees up.
