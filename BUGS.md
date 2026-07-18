# Known Issues & Fixes

A running log of non-obvious problems hit during development and how they were resolved.

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
