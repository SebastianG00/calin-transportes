# Transportes Kalin — Project Design Decisions (interview prep)

> A **system-level** Q&A walkthrough of the whole platform: what it does, how it's built, the
> cross-cutting design decisions, what's deliberately *not* built, and why. Interview-framed;
> every answer maps to real code in this repo.
>
> **Companion docs** (deeper dives): `ai-vision-design-decisions-interview.md` (the AI/OCR
> "Leer con IA" feature in detail), `slice2-delivery-pipeline-explained.md` +
> `slice2-tier2-explained.md` (plain-English narratives of the delivery/document pipeline).
> Roadmap/backlog: `TODO.md`. Design specs (gitignored): `docs/superpowers/specs/`.

---

## The 30-second pitch

**Transportes Kalin** is a small Peruvian trucking company. This is a **coordination + delivery-
confirmation platform** for it: the office runs everything from a **web panel** (assign loads,
track them, review delivery documents, manage the fleet, invoice), and **drivers confirm loads
over WhatsApp — installing nothing**. The differentiating core is **delivery-document
intelligence**: a driver photographs the signed *guía de remisión*, an AI vision model reads it,
and deterministic code reconciles it against the load we already created before marking it
delivered. Built as a **monorepo** (typed shared core, Express API + bot, React panel) on
**Supabase**, with AI (Claude) confined to *reading messy input* while all consequential
decisions run through auditable, deterministic code.

---

## 1. What is it / the domain

**Q: In one breath — what does the product actually do?**
The office creates a **load** (cargo, weight, route, client) and assigns a **driver + unit**. The
driver gets a WhatsApp message and confirms. The load moves through a lifecycle
(`unassigned → sent → confirmed → en_route → delivered`, or `cancelled`). On delivery the receiver
signs a paper **guía de remisión**; the driver photographs it; the office reviews it (AI-assisted)
and confirms delivery. Around that spine sits fleet management (drivers, units, fuel/maintenance
logs, a distribution map), invoicing (**facturas** capture → accountant CSV), tasks/calendar,
parts **inventory**, and a set of **AI office helpers** (drafts, a natural-language data assistant).

**Q: Why does "drivers install nothing" matter as a constraint?**
It's the core product bet. Peruvian truck drivers won't install a bespoke app, but everyone uses
WhatsApp. So the driver-facing surface is *just WhatsApp*; all the complexity lives in the office
panel and the server. That constraint shaped the whole architecture — a **provider abstraction**
for messaging, an inbound-reply correlation service, and (deferred) a WhatsApp Business
integration.

---

## 2. Architecture & tech stack

**Q: How is the codebase organized?**
An npm-workspaces **monorepo** with three packages:
- **`shared/`** (`@tp/types`) — the typed core shared by both ends: **Zod** models, the **load-status
  state machine**, the **RUC checksum** (Peruvian tax-ID validation), the **SUNAT QR** parser, and
  the **WhatsApp provider contract**. One source of truth for types and domain rules.
- **`server/`** — Express **API + bot**: HTTP routes, domain services, the state machine, timer
  sweeps, WhatsApp providers, the AI integrations, and the Supabase (service-role) data layer.
- **`web/`** — the React office panel.

**Q: What's the stack, and why each piece?**
- **Supabase** (Postgres + Auth + Storage) — managed Postgres with **row-level security**, JWT auth,
  and private file storage in one platform; lets a solo build ship a secure multi-user app fast.
- **Express + TypeScript (ESM)** on the server; **Zod** everywhere for runtime validation at the
  boundary + inferred types.
- **React + Vite + shadcn (on Base UI) + Tailwind v4** on the web, with **TanStack Table**
  (data grids), **Recharts** (dashboard), **react-router**, **sonner** (toasts), **next-themes**
  (light/dark), **date-fns** + a full-calendar. **Spanish UI, neutral theme, color only in status
  badges.**
- **`@anthropic-ai/sdk`** (`claude-opus-4-8`) for the AI features; **`tesseract.js`** for OCR
  grounding; **`twilio`** for WhatsApp (with a fake provider for dev).
- **Vitest** for tests.

**Q: Where's the data model, and how has it evolved?**
Twelve SQL migrations (`0001`–`0012`), ~20 tables: `loads`, `drivers`, `units`, `clients`,
`load_events` (append-only), `messages`, `pending_prompts`, `app_settings`; then `load_documents`
+ `document_events` (delivery docs), `requirement_clauses` + `document_templates` +
`delivery_guias` + `delivery_emails` (client docs), `unit_expenses` + `unit_maintenance` (fleet
logs), `facturas`, `tasks`, and `inventory_items` + `inventory_movements`. Each feature slice added
its migration; the schema grew additively.

---

## 3. The cross-cutting design principles (the spine)

This is the most important section — the decisions that repeat across every feature.

**Q: What's the single most important architectural rule?**
**The frontend is read-only; the server is the only writer.** Postgres **RLS** gives the
browser's authenticated key **read-only** access (no write policies exist for it, so writes are
denied); the **server's service-role key bypasses RLS and is the sole writer.** Every mutation
goes through the authenticated Express API. A compromised or buggy client physically cannot flip a
load to *delivered*, edit a document, or change stock — it can only read what RLS lets it read.

**Q: Second principle — the AI-vs-deterministic line?**
**AI reads; deterministic code decides and writes.** LLMs are confined to what they're uniquely
good at — reading messy documents, drafting prose, turning prose into structured rules — while
every consequential value (a weight on a signed guía, a total on an invoice, a stock level) is
produced by **deterministic code copying confirmed values**, never free-written by a model. The
guiding line: **confidence is computed from evidence, never the model's self-reported certainty.**
(The AI-vision doc drills into this for the delivery-document feature.)

**Q: How do you handle concurrency / correctness on the load lifecycle?**
Two mechanisms. (1) A **partial unique index** `one_active_load_per_driver` (on active statuses
`sent|confirmed|en_route`) makes "a driver can't have two live loads" a *database* invariant, not
app logic. (2) **Timer sweeps** (no-response flag + reminder) run as two independent **atomic
claims** — each row is claimed at most once, so the sweeps are crash-recoverable and safe to run
in parallel (proven with a parallel-run test).

**Q: Human-in-the-loop — where and why?**
Everywhere a mistake would be expensive: **100% human confirmation** on delivery documents and
invoices before anything is recorded; AI outputs are always **editable drafts**; validation
**annotates, never blocks** (red just triggers an "are you sure?" override — the human is the
authority because the software can be wrong too).

**Q: Auditability?**
**Append-only event logs.** `load_events` and `document_events` record every state transition and
document action with who + when + why; per-field `source` provenance (`qr` / `vlm` / `human`) tells
you which values a person vouched for. That's both the compliance trail and the future eval dataset.

---

## 3b. Database design decisions

**Q: Why a relational DB (Postgres) rather than NoSQL?**
The domain is **heavily relational** — loads ↔ drivers ↔ units ↔ clients ↔ documents ↔ events — and
the correctness rules are things a relational engine enforces for free: foreign keys, uniqueness,
CHECK constraints, transactions, and **RLS** for security. In a document store all of that becomes
hand-written app code. So integrity lives in the **schema**, not the application.

**Q: Give examples of invariants enforced by the database, not app logic.**
- **`one_active_load_per_driver`** — a *partial* unique index on `assigned_driver_id` where
  `status in (sent,confirmed,en_route)`: "a driver can't have two live loads" is a DB guarantee.
- **UNIQUE** on `drivers.whatsapp_phone`, `units.plate`, and — crucially — `messages.provider_message_sid`.
- **CHECK** constraints pin enums (`load status`, `tipo`, `categoria`, `review_status`) at the column.

**Q: How do you make the WhatsApp inbound path idempotent?**
`messages.provider_message_sid` is **UNIQUE**. WhatsApp/webhook delivery retries the same reply; the
unique SID means we can't double-process it (a duplicate insert simply conflicts). The fake dev
provider generates unique SIDs to mirror the real one — so the idempotency path is exercised in dev.

**Q: You store AI output in a `jsonb` column — why not columns?**
The delivery-document read is an **evolving, per-field payload** — each field carries
`{value, verbatim, source, bbox, checks}` and the set grew as the feature did (Tier-2 grounding
`bbox` slotted into `load_documents.extracted` with **zero migration**). So it's a deliberate
**hybrid**: structured columns for what you *query, index, or constrain* (`review_status`, `phash`,
the identity fields), and `jsonb` for the flexible AI payload. You get relational integrity where it
matters and document-store flexibility where the shape churns.

**Q: The append-only `*_events` tables — is that event sourcing?**
Event-sourcing-*lite*. `load_events` and `document_events` are **immutable audit logs** (the current
state is still the row on `loads`/`load_documents`; the event tables are the history). Cheap to
write, impossible to tamper with in place, and they double as the **eval/compliance dataset** — who
did what, when, and why. Provenance goes further: per-field `source` (`qr`/`vlm`/`human`) records
which values a person actually vouched for.

**Q: Derived vs stored — the inventory example.**
Inventory **stock is derived** (`sum(entradas) − sum(salidas)` over the append-only
`inventory_movements`), never a stored counter. That eliminates stored-vs-real drift and
update-contention races by construction; the cost is a read-time aggregation, which is trivial at
this scale (and would become a stored counter via an atomic RPC only if movement volume exploded).

**Q: Indexing + migrations discipline?**
Indexes sit on the actual query paths — FK+`created_at` composites (`load_events`, `messages`,
`load_documents`), status filters (`review_status`, `tasks.estado`, `facturas.review_status`), and
entity/item lookups (`unit_expenses`, `inventory_movements`). Migrations are **numbered, forward-only,
additive** SQL (`0001`–`0012`), one per slice; the test harness wipes tables in **FK-dependency
order** so integration tests start clean.

---

## 3c. Scalability, performance & sharding

**Q: What's the honest current scale, and what actually needs to scale?**
One small operator — hundreds of loads/month, a handful of concurrent office users, one driver
channel. A single Postgres serves this with enormous headroom. So most of this is about the
**scaling path**, not a present bottleneck — and being honest about that is the point.

**Q: What scales with no code changes?**
Three structural properties:
1. **The API is stateless.** It talks to Postgres via **PostgREST (supabase-js)** with the
   service-role key and holds no session state → it scales **horizontally** behind a load balancer.
2. **The timer sweeps use atomic claims** (each row claimed at most once, crash-recoverable,
   race-tested) → you can run **multiple API instances** and the sweeps stay at-most-once with **no
   leader election**.
3. **The read-heavy panel reads Postgres directly through RLS** (supabase-js in the hooks), which
   **offloads reads off the API** entirely — the API is left to handle writes + compute.

**Q: Where would it strain first, and the fix?**
- **In-JS aggregates over unbounded fetches** — the assistant's client-volume ranking once capped at
  1000 rows; already fixed with **pagination**, and would graduate to a **DB-side aggregate/RPC or a
  rollup table** at real volume.
- **Derived inventory stock** → a stored counter maintained by an atomic RPC.
- **Vision AI cost** scales per document → the **on-demand** design bounds it now; at volume you'd add
  cheaper-model triage/batching.
- **The free-tier DB** (pauses on inactivity; the direct host is IPv6-only, so migrations use the
  IPv4 **transaction pooler**) → a paid tier + **PgBouncer** connection pooling.

**Q: Storage?**
Images live in **Supabase Storage** (object storage, scales independently of the DB) and are served
via short-lived **signed URLs**; the database only ever stores the path. So file growth never
pressures the relational store.

**Q: Multi-tenant (many trucking companies)?**
The schema is already **per-client-shaped** (documents, clauses, templates scoped by client). To host
many *companies*, you add a `tenant_id`/org column and **RLS-by-tenant**, so isolation is enforced by
the **database** and every query is automatically scoped. That's the natural step *before* any thought
of sharding.

**Q: Would you shard the database? Why / why not?**
**No — sharding here would be premature and probably wrong.** A single Postgres comfortably serves
this workload and would serve a multi-tenant SaaS of many small operators for a very long time.
Sharding buys throughput at a steep price: **cross-shard queries, loss of cross-shard transactions
and FKs, and a much harder RLS/security story** — real costs for a problem we don't have. The
**ordered** scaling path is: indexes (done) → connection pooling → **read replicas** for the
read-heavy panel → **table partitioning** for the append-only giants (`load_events`, `messages`,
`document_events`) by time → tenant-based **logical** sharding (Citus, or a DB-per-large-tenant) only
if a single primary genuinely can't keep up. Sharding is the **last** lever, not the first — and
because the design is already **append-only and tenant-scoped**, the natural shard/partition key
(tenant, or time for the event logs) is *already there* when that day comes.

**Q: The biggest *non-tech* scaling limit?**
Human vision-review throughput and the deferred production WhatsApp channel (paid + Meta approval) —
ops/business constraints, not database ones.

---

## 4. What's built (scope)

**Q: Walk me through the feature surface.**
Roughly eight subsystems, all shipped:
1. **Assign & Confirm** (the coordination loop) — loads, drivers, units, the state machine, WhatsApp
   assign/remind, inbound-reply confirmation, timer sweeps.
2. **Delivery & Document Intelligence** — the differentiating core. *Tier 1* (deterministic): upload
   → dedup (pHash) → quality gate → SUNAT-QR-for-facturas + 3-way reconciliation → review queue,
   audit. *Tier 2* (AI): **"Leer con IA"** — Claude vision reads the QR-less guía + Tesseract
   grounding (see the AI-vision doc).
3. **Client Documents & Profiles** — reusable **requirement clauses** (AI drafts from prose, human
   approves), a **deterministic pre-trip guía builder** (AI never writes the signed doc), an **AI
   summary email**, editable clients.
4. **Facturas** — invoice capture → AI vision (9 accountant fields) → human confirm → **monthly
   accountant CSV export**.
5. **Fleet & ops** — driver profiles, unit fuel/gasto + maintenance logs, a Peru distribution map.
6. **Tareas + Calendario** — office tasks and a live calendar (loads by date + dated tasks).
7. **AI office helpers (Slice 7)** — **WhatsApp message drafts** (intent + free-text → editable
   Spanish draft, no send) and a **natural-language DB assistant** ("Asistente IA": whitelisted
   query catalog, no free-form SQL — the model picks a parameterized query, the server runs it).
8. **Inventario** — fleet parts stock with derived on-hand + entrada/salida movements + low-stock
   alerts.

Twelve API routers behind `requireAuth`; ~20 web screens.

---

## 5. What's deliberately NOT built (and why)

**Q: What did you consciously defer, and what's the reasoning?** *(This is a scoping-judgment
question — the "no" decisions matter as much as the "yes" ones.)*
- **Phase 6 — real WhatsApp send (go-live).** Everything is built *except* the paid channel:
  production WhatsApp needs a paid Twilio subscription + a registered WhatsApp Business number +
  Meta-approved message templates. For a small operation that overhead isn't worth it — and it's
  **not needed to use the app**: the office can draft the message with the AI helper, send it from
  *their own* WhatsApp, and click the status button. The cheap-automation alternative (a **$0
  magic-link confirm page**) is scoped but parked.
- **Slice 4 — legally-binding e-signatures.** Deliberately dropped: the legally-meaningful signature
  is the **receiver's physical signature on the printed guía**, which we already capture and read.
  A certified e-signature (RENIEC / firma digital) adds real compliance liability and cost for
  something the physical-signature-photo flow + an internal approval flag already cover.
- **Fine-tuning / training a model.** We call a pre-trained Claude via API — cheaper, faster, and the
  moat is the deterministic harness (reconciliation + audit + review UX), not model weights.

The through-line: **build the differentiated, deterministic core; defer the pieces whose cost or
liability is disproportionate to the value for a small operator.**

---

## 6. Testing & quality philosophy

**Q: How is it tested?**
~**127 server tests** (Vitest) covering the state machine, reconciliation, the timer sweeps
(including a parallel-run race test), the AI plumbing (model calls mocked), and integration tests
against a dev Supabase. AI **evals are opt-in** (`RUN_AI_EVAL=1`, skipped in CI) so CI stays free
and deterministic; the vision pipeline is proven on **programmatic mock guías** with free
ground-truth, and real-photo robustness is an explicit *later* gate — an honest boundary, not a
hidden gap.

**Q: How was it built (process)?**
Spec → plan → **subagent-driven development**: a fresh implementer per task, a per-task review (spec
compliance + code quality), and a whole-branch review before merge. Every feature branch merged to
`main` green. It's why the deferred-minor lists and the hardening passes are tracked rather than
lost.

---

## 7. The AI features, at a glance

**Q: Where is AI used, and how is each one kept safe?**
Six AI touch-points, all guarded (`getAnthropic()` returns a friendly 503 when the key is unset)
and all **read/draft-only**:
1. **Guía vision extraction** ("Leer con IA") — vision read + OCR grounding + reconciliation (deep
   dive in the AI-vision doc).
2. **Factura vision** — same pattern, 9 accountant fields, for invoicing.
3. **Requirement-clause drafting** — prose → structured clause; human approves before save.
4. **Deterministic guía builder** — AI *never* writes the signed doc; it only helped author the
   reusable clauses. Producing each trip's guía is a deterministic template-fill of confirmed values.
5. **AI summary email + WhatsApp drafts** — draft-from-confirmed-data, editable, **no auto-send**,
   with a no-invention guardrail (numbers only from the load) and prompt-injection resistance
   (free-text can change tone/length/format only).
6. **NL DB assistant** — the model picks **one whitelisted, parameterized query** from a fixed
   catalog (via structured output) + extracts params; the **server validates and runs the
   hand-written SELECT** (read-only), then the model writes a one-sentence Spanish gloss. The model
   never writes SQL — the catalog is the trust boundary.

The pattern is identical every time: **the model's output is a proposal that deterministic,
validated code turns into an action — or doesn't.**

---

## 8. War stories (interesting bugs / decisions)

**Q: A few real problems you hit and how you solved them?**
- **Silent NaN in reconciliation.** `Number("8,900")` → `NaN` *silently skipped* the weight check —
  the worst failure (looks fine, checks nothing). Fixed with a tolerant `parsePeso` + accent-folding
  in text matching, both tested. (The same accent theme recurred: entity resolution and OCR
  grounding both needed Unicode-NFD folding for "Juán"/"Cañete".)
- **A build artifact ran stale.** The server imports `@tp/types` from `shared/dist` (a gitignored
  build output). A fix edited `shared/src` but didn't rebuild `dist`, so the running server enforced
  an *old* validation schema and rejected valid requests. Root-caused by comparing dist vs src;
  the lesson (rebuild shared after editing it) is now documented.
- **The empty-params assistant bug.** The NL assistant returned "no puedo" for clear questions
  because the selection schema exposed params as an opaque record, so the model never filled
  `driver_name`. Fixed by giving the model explicit typed param fields — a prompt/schema-design bug,
  not a model failure.
- **A UI library gotcha.** shadcn here is built on **Base UI** (not Radix): `Select` needs an `items`
  prop to render labels and triggers use `render=` not `asChild`. A dropdown showed raw values until
  that was found — a good reminder to verify the actual primitive, not assume.

---

## 9. Curveballs / trade-offs

- **"Why Supabase over rolling your own auth + Postgres?"** — RLS + Auth + Storage in one platform
  lets the read-only-frontend / service-role-writer security model be enforced by the *database*,
  and lets a solo build ship securely fast. The trade is vendor coupling + a free-tier that pauses
  on inactivity (handled with a connection retry).
- **"Isn't 'one AI call per document' limiting?"** — It's deliberate: **on-demand** (a button, on a
  photo a human is actively reviewing) bounds cost and means we never burn a vision call on junk the
  Tier-1 quality gate already rejected.
- **"How would this scale past one client?"** — The domain rules live in `shared/` and the schema is
  multi-tenant-shaped (per-client documents, clauses). The current bottleneck isn't tech, it's the
  deferred production WhatsApp channel — a business/compliance step, not a code one.
- **"What's the biggest risk?"** — Over-trusting the model on edge cases. Mitigated *structurally*
  (evidence-based confidence, grounding as provenance, reconciliation against known truth, 100%
  human confirm), so the AI can be wrong and the system still can't silently record a bad delivery
  or invoice.
