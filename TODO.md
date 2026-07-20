# Transportes Kalin — Future Slices Backlog

Living backlog of everything **out of scope for Slice 1** (Assign & Confirm) but
part of the full product. Each future slice gets its own `brainstorming` →
`spec` → `writing-plans` → build cycle. Use the "clarify" bullets to seed the
clarification questions when that slice comes up.

- **Slice 1 (in progress):** Foundation + Assign & Confirm (W1). Spec:
  `docs/superpowers/specs/2026-07-15-transportes-kalin-slice1-assign-confirm-design.md`
- **Product = ~8 subsystems.** Slice 1 is the coordination loop + data
  foundation. Everything below builds on it.

---

## Seams already built in Slice 1 (so future slices attach cleanly)

These exist from day one specifically so later work needs no migration:

- **`messages` table** records inbound photos with `media_storage_path` (bytes
  in private Storage, immutable), `media_url` (provenance), `processed=false`.
  → Slice 2 pipeline attaches here and can **backfill** existing photos.
- **`pending_prompts` table** holds conversation state (`decline_reason` today).
  → Slice 2 dialog kinds: `retake_photo`, `confirm_delivery`, etc.
- **`app_settings` singleton** = table-driven business rules pattern.
  → Slice 3 per-client rules generalize this (tolerances, templates per client).
- **Provider interface** (`twilio`|`meta`|`poc`) already abstracts WhatsApp.
- **`timers/` registry** already holds business timers.
  → Add `stuck_en_route` alerts, `retake_photo` expiry, etc.
- **Data-model note for Slice 2:** when the pipeline lands, extracted fields must
  record `source` (qr|ocr|vlm|human) and **per-field evidence** from day one so
  Tier-2 grounding (bounding boxes) slots in without a migration.

---

## Slice 2 — Delivery & Document Intelligence Pipeline (W2 + W3) ⭐ the hard one

> **2026-07-20 — Slice 2 (Tier 2, the AI layer) is being MERGED with Slice 3 (per-client rules)**
> into one AI document-intelligence program of **two specs** (see NEXT.md for the live plan):
> - **Tier 1** ✅ DONE (deterministic: QR-for-facturas + checksums + 3-way reconciliation + review
>   queue, merged @ 46e1316).
> - **Spec 1 — Client Documents & Profiles** (= Capability B **+ Slice 3 fused**): composable
>   per-client requirement clauses (AI drafts from prose) + per-trip proof-of-delivery guía
>   (deterministic fill) + AI summary email + client management. ▶️ next, no photos needed.
> - **Spec 2 — Guía Vision Extraction** (= Capability A): VLM reads QR-less guías + Tesseract
>   grounding + signature-verify + workbench + evals (mock data now, real photos later).
>
> **KEY:** guías have **NO QR** (signature = proof; QR only on facturas) → VLM is the primary reader.
> AI authors requirement clauses (per-trip-capable); producing each guía is deterministic fill (safety).

The technically hard, differentiating core. Likely **splits into sub-slices**
(intake+QR+checksums first; VLM+grounding+workbench next; evals last).

**Delivers:** driver photographs stamped guía → pipeline → review queue →
archived against the load → status `delivered`.

### Pipeline stages (from the brief)
- **0 Intake:** idempotent webhook (already in Slice 1), immutable original store
  (already in Slice 1), perceptual-hash dedup, attach to driver's active load
  (the "one active load per driver" index makes this unambiguous).
- **1 Quality gate:** blur/darkness detection (variance-of-Laplacian); fail →
  auto "retake" WhatsApp reply while the driver is still at the delivery point.
- **2 Classify:** `gre_remitente | gre_transportista | factura | other`; "other"
  → dispatcher inbox.
- **3 Deterministic first (QR):** decode SUNAT-mandated QR on electronic
  guías/invoices → exact RUC, serie–número, document identity — free, zero
  hallucination. Regex format checks. AI only fills what the QR can't say.
- **4 VLM extraction:** Claude vision, strict JSON tool-use schema, temperature
  0, prompt seeded with QR payload + load record + 1–3 few-shot examples of that
  client's guía layout. (Model cascade deferred — start with one good model.)
- **5 Grounding & validation (DEEP DIVE — deterministic code, no AI):** the
  safety net between model and DB. See dedicated section below.
- **6 Confidence & routing:** per-field score → green/amber/red. **Launch policy:
  100% human confirmation**; thresholds loosen later only with golden-set
  evidence.
- **7 Review workbench:** photo with bounding-box highlights side-by-side with
  the form; click a field → zoom to its region; keyboard-first; every correction
  logged (field, old→new, who, when).
- **8 Evals:** golden set of ~40 labeled real guías as a regression suite for any
  prompt/model change; per-client per-field accuracy dashboard; corrections
  become few-shot candidates.

### Stage 5 deep dive — Grounding & Validation (deterministic, unit-testable)
Core principle: **confidence is computed from evidence, never from the model's
self-reported certainty.** Four evidence sources, strongest→softest:
- **6.1 Grounding** — OCR once/image → `{text, bbox}` tokens; normalize both
  sides; exact → sliding-window multi-token → fuzzy (Levenshtein ≥ ~0.85).
  Hit → attach merged bbox (drives review highlight + provenance). Miss →
  `grounded:false` → cap confidence ≤ 0.5, force amber (human verifies; NOT
  auto-wrong — handwriting fails OCR but VLM may read it). QR-sourced fields
  skip grounding. **Tiering:** grounding+bbox is a **Tier-2 upgrade**; Tier 1
  ships checksums + sanity + reconciliation only, but the data model records
  `source` + per-field evidence from day 1.
- **6.2 Checksums & formats** — **RUC mod-11 check digit** (already built in
  Slice 1's seed validator — reuse it!). Weights 5,4,3,2,7,6,5,4,3,2;
  d = 11 − (sum mod 11); 10→0, 11→1. Prefix check (20 companies, 10
  individuals; 15/16/17 exist). serie–número regex, plate regex, parseable
  dates.
- **6.3 Sanity rules** — date not future & inside load window; weight within
  client min/max (from client-rules table); required fields present. Pure
  functions returning `{pass|fail, reason_code}`; annotate, never mutate.
- **6.4 Three-way reconciliation** — the structural advantage (the system
  created the load, so ground truth exists before the photo): client RUC exact;
  destination fuzzy; weight/qty within tolerance (±5% default, per-client);
  plate = assigned unit; date in window. Mismatch = flag with machine-readable
  reason code (e.g. `WEIGHT_MISMATCH {guia:8500, load:9000}`) shown in plain
  Spanish; human decides which side is wrong; either correction logged.
- **6.5 Output contract:** per field `{value, source, grounded, bbox?, checks:
  [{rule,pass,reason_code?}]}` + doc-level summary → Stage 6 folds into
  composite confidence.
- **6.6 Implementation:** pure sync dependency-free functions (OCR is the only
  external call, made once); table-driven rules (per-client tolerances in DB);
  exhaustive unit tests incl. real RUCs + adversarial near-misses; validation
  never mutates — only humans correct; log every verdict (validation log +
  correction log = audit trail + eval dataset).

**Clarify (when Slice 2 starts):**
- Sub-slice boundary: ship Tier-1 (QR + checksums + sanity + reconciliation +
  basic review queue) before Tier-2 (OCR grounding + bbox workbench)?
- OCR engine: Google Vision (better on Spanish/stamps, costs) vs Tesseract (free,
  PoC).
- Which clients' guía layouts to collect few-shot examples + the ~40 golden set
  from first?
- Review workbench UX depth for v1 (keyboard-first + zoom vs simpler).
- Perceptual-hash dedup threshold.

---

## Slice 3 — Per-client rules engine (⚠️ FUSED into Slice 2's AI program — see NEXT.md)

> **2026-07-20 reframe:** Slice 3 is no longer a standalone slice. Its core (per-client
> requirements/rules) is **folded into "Spec 1 — Client Documents & Profiles"** of the AI
> document-intelligence program (Slice 2 Tier 2 + Slice 3). Requirements are modeled in 3
> buckets: **reconcile** (data: weight/time/plate), **verify** (vision: signature/stamp), and
> **attest** (human checkbox: clean/odorless/EPP/stops). AI drafts the structured checklist
> from a client's prose. Build it there, NOT separately. Details live in NEXT.md + the (coming)
> `docs/superpowers/specs/` Spec-1 design.

**Original delivers (for reference):** client management UI (deferred from Slice 1) + per-client
rules that reconciliation and message templating consume: weight min/max, weight tolerance,
destination aliases, required document types, message-language quirks.

**Depends on:** generalizes Slice 1's `app_settings` pattern.

---

## Slice 4 — E-signature option (W4)

**Delivers:** for clients who accept it, their rep approves the guía digitally via
link/on-screen with date/time/identity logged — eliminates the stamp trip.

**Legal (Peru):** simple in-app signature = proof of acceptance only; full
handwritten-equivalent validity needs an **IOFE-certified signature** (Law 27269
— INDECOPI-accredited PSC or RENIEC eDNI). Legality comes from the certificate,
not our software. Clients insisting on physical stamp: trip still happens; we
digitize the result.

**Clarify:** which clients accept e-sign? simple vs IOFE per client? PSC/RENIEC
integration scope? link delivery channel (WhatsApp/email)?

---

## Slice 5 — Accountant export (W5)

**Delivers:** monthly ordered package (CSV/XLSX + original images) of
invoice/guía data per load, every number traceable to its provenance. **System
never issues to SUNAT.**

**Clarify:** exact column schema the accountant wants? grouping (per client / per
month)? image packaging format? provenance columns.

**Depends on:** Slice 2 (extraction data + provenance).

---

## Slice 6 — Inventory module (simple)

**Delivers:** simple inventory module (scope from brief is light — clarify
before building).

**Clarify:** what's tracked (spare parts? cargo? fuel?)? who updates it? relation
to loads/units? This is the least-specified subsystem — needs its own
brainstorming.

---

## Slice 7 — AI office helpers (W6, all human-approved before use)

**Delivers:**
- **Draft guía** per client template (same JSON schema as extraction, rendered
  in reverse).
- **Draft WhatsApp messages** per client rules.
- **Natural-language assistant** answering from **defined DB queries** — **no RAG
  / vector DB** (data is structured).

**Clarify:** which drafts first? approval UX? which NL queries to whitelist?

**Depends on:** Slice 2 (schema) + Slice 3 (client rules).

---

## Fleet & ops enhancements (NEW — beyond the original 8 subsystems)

Ideas raised during the Slice-1 design loop. **Manual logs, not sensor
telemetry** — so they don't conflict with the "no sensor API / predictive
maintenance" boundary (that ruled out *automated* truck telemetry). Each lives
inside an existing screen's detail view to keep the flat sidebar clean.

- **Unit fuel / expense log** — per-truck manual entries (galones / S/ gastados
  en combustible, y otros gastos). Lives in the **Unidades → truck detail**
  (tab "Combustible / Gastos"). Enables a "gasto por unidad" view over time.
- **Truck wash / maintenance log** — per-truck manual log: last washed/cleaned
  loading zone, mantenimientos. Lives in **Unidades → truck detail** (tab
  "Mantenimiento / Lavado").
- **Driver profiles** — enhance the existing **Conductores** tab: per-driver
  detail (foto, licencia, teléfono, historial de cargas). A load's detail links
  the driver name → their profile.
- **Distribution map** — new item under **Operación**: Peru map colored by
  load **destination city/región** (from the origin/destination text we store).
  ⚠ NOT live truck tracking — we have no GPS API (Comsatel gives none). City-
  level distribution viz only.

**Clarify when built:** who enters fuel/wash data & how often? cost currency/
categories? driver-profile fields + who edits? map granularity (ciudad vs
región)?

---

## Cross-cutting / deferred infra

- **Meta production migration** — business verification + pre-approved templates
  (weeks of lead time — **START DAY 1 of Slice 1 build**). Submit **two**
  templates (assignment + reminder). Swap provider adapter `twilio`→`meta`.
- **Owner/secretary permission split** — Slice 1 uses a single "office" role.
- **CI/CD** (GitHub Actions) — deferred; tests runnable locally meanwhile.
- **Sentry** — deferred; interim = structured JSON logs from Slice 1.
- **PoC unofficial-lib adapter** — dedicated test number, ban risk understood.

---

## NOT building (hard boundaries — from the brief)

GPS/routes/mileage (Comsatel) · navigation (Waze) · cameras/fatigue AI (drivers
rejected) · SUNAT invoice issuance (accountant, regulated) · AI route
optimization · predictive maintenance (no sensor API) · demand forecasting (~15
clients = too little data) · multi-load-per-driver matching (breaks the
photo-attach guarantee).
