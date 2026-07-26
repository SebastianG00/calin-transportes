# AI Guía-Vision — Design Decisions (interview prep)

> A Q&A walkthrough of the design decisions behind the **"Leer con IA"** feature: an
> LLM vision reader + OCR grounding + deterministic reconciliation for Peruvian
> *guías de remisión* (proof-of-delivery documents). Framed as an interviewer might
> probe it. Every answer maps to real code in this repo.
>
> Companion narrative docs: `slice2-delivery-pipeline-explained.md` (Tier 1, deterministic),
> `slice2-tier2-explained.md` (the AI layer). Design spec (gitignored):
> `docs/superpowers/specs/2026-07-20-spec2-guia-vision-extraction-design.md`.

---

## The 30-second pitch

A driver delivers a load and the receiver signs a paper guía. The driver photographs it;
the office opens it in a **review queue** and clicks **"Leer con IA."** One Claude **vision**
call reads the 13 fields off the image and reports whether a signature/stamp is present.
**Tesseract OCR** independently finds where each value sits on the page, so we can draw
highlight boxes and *ground* the model's output in pixels. The read is then **reconciled**
against the load we already created (weight, plate, destination, date) — green/amber/red,
**annotate never block**. A human confirms; only then does the load become *delivered*. The
AI reads; **deterministic code decides and writes.**

---

## 1. Architecture & the AI-vs-deterministic line

**Q: Where exactly is the AI, and where is it deliberately *not*?**
There is exactly **one AI call**: reading the image (extract 13 fields + signature/stamp
booleans). Everything else is deterministic — OCR word boxes (Tesseract), grounding (a pure
string-match function), reconciliation against the load (reused Tier-1 checks), and filling
the form (copying values verbatim). No AI writes to the database or advances load state.

**Q: Why draw that line there?**
Safety and cost, in that order. A guía is a semi-legal, invoiceable document. If the AI
*wrote* it, it could hallucinate a wrong weight or RUC onto a signed record. So AI is confined
to **reading messy input** — the thing it's uniquely good at — while all consequential
decisions run through auditable, testable, deterministic code. This is the core principle:
**confidence is computed from evidence, never from the model's self-reported certainty.**

**Q: Why is the VLM the *primary* reader here, unlike a typical OCR-first invoice pipeline?**
Domain fact: Peruvian **guías de remisión have no QR code** — delivery is proven by the
**receiver's signature**. Only *facturas* carry the SUNAT QR. With no QR to decode, there's no
free exact source of truth, so the vision model becomes the primary reader. (The QR path we
built in Tier 1 isn't wasted — it's correctly scoped to facturas, and its validators /
reconciliation / review queue / audit trail are the harness the VLM now feeds.)

---

## 2. Model & extraction

**Q: Which model, and how do you get structured output?**
`claude-opus-4-8` (vision-capable), overridable via `CLAUDE_MODEL`. We use the Anthropic SDK's
`messages.parse` with a **Zod schema** (`zodOutputFormat`) so the response is constrained to the
exact field shape — no free-text parsing, no "please return JSON" prompting.

**Q: How do you make it deterministic? Temperature 0?**
On this model sampling params are removed, so determinism comes from **structured output + low
reasoning effort** rather than `temperature: 0`. The schema leaves no room to wander, and low
effort keeps it from over-reasoning a straightforward transcription task.

**Q: What are the 13 fields, and why the `{value, verbatim}` split?**
11 text fields (`receptor`, `ruc_receptor`, `fecha_entrega`, `peso`, `bultos`, `destino`,
`conductor`, `placa`, `guia_serie`, `guia_numero`, `observaciones`) plus 2 booleans
(`firma_presente`, `sello_presente`). Each text field returns **`value`** (normalized — e.g. a
date as `YYYY-MM-DD`) *and* **`verbatim`** (exactly as printed — `01/08/2026`). `value` is what
reconciliation compares; `verbatim` is the **join key for grounding** (below). Decoupling
"what it means" from "how it's written" is what makes both jobs clean.

**Q: How do you stop it from inventing data?**
The prompt asks it to read only what's visible and return empty/false when a field is absent —
never guess. And the output is always a **draft a human confirms**, so a bad read is caught at
review, not in the database.

---

## 3. OCR & grounding (the trust mechanism)

**Q: You already have a vision model — why also run Tesseract OCR?**
Two different jobs. The VLM reads *what* the values are; Tesseract tells us *where* they are on
the page (word bounding boxes). We deliberately **don't trust VLM-emitted coordinates** — they're
unreliable. Instead, `groundFields` (a pure, unit-tested function) fuzzy-matches each field's
`verbatim` string to contiguous OCR tokens and attaches that box. That box drives the
highlight overlay and serves as **provenance** — a reviewer sees the model's answer sitting on
the actual pixels it came from.

**Q: What if grounding misses?**
Non-fatal. The field keeps its value with `bbox: null` and just isn't highlighted. A miss
doesn't mean the value is wrong (handwriting fails OCR but the VLM may still read it) — so we
never auto-reject on a grounding miss; we just lose the visual highlight for that one field.

**Q: How do you know the boxes actually land on the right values?**
The eval measures **grounding IoU** (intersection-over-union) against known ground-truth boxes,
with a threshold (>0.3). See §6.

---

## 4. Reconciliation (the structural advantage)

**Q: What's the trust model beyond just reading the doc?**
We **created the load before the photo exists** — so we already have ground truth: weight,
assigned plate, destination, scheduled date. Reconciliation is a three-way check of the read
values against that record: weight within tolerance, plate exact, destination fuzzy-match,
date in window. Each mismatch is a machine-readable reason code shown in plain Spanish.

**Q: Green/amber/red — does red block the confirm?**
No. **Annotate, never block.** Validation only flags; the human decides which side is wrong (the
guía or our record) and either correction is logged. Red just triggers an
"are-you-sure" override dialog. This is deliberate: the software can be wrong (bad OCR, a typo
in our load) and the human is the authority.

**Q: A real-world reconciliation bug you hit?**
Two, both from real Peruvian formatting: place names carry accents ("Cañete" vs "Canete") and
weights print as "8,900 kg" / "8.900". The naive `Number("8,900")` returned `NaN` and *silently
skipped* the weight check entirely — the worst kind of failure (looks fine, checks nothing). Fixed
with accent-stripping (Unicode NFD) in text matching and a tolerant `parsePeso` (strips units +
thousands/decimal separators), both covered by tests.

---

## 5. Human-in-the-loop & safety

**Q: How much is automated?**
**100% human confirmation** at launch. Every guía is a draft until an office user confirms it.
Thresholds only loosen later with golden-set evidence — we don't ship auto-approve on day one.

**Q: Why is it "on-demand" (a button) rather than auto-running in the ingest pipeline?**
Cost and control. Tier-1's quality gate already rejects blurry/duplicate/junk photos before they
reach review, so we don't want to burn a vision call on those. Running it when the office clicks
**"Leer con IA"** means every call is on a photo a human is actively reviewing.

**Q: What's the audit trail?**
Every extraction appends a `document_events` row (`kind: 'vlm_extracted'`) with the raw model
response + OCR boxes; every confirm/reject/correction is logged with who and when. That's both
the compliance trail and the future real-photo eval dataset.

---

## 6. Testing & evals without real photos

**Q: You built this before having real guía photos. How did you test it?**
**Programmatic mock guías** rendered with jimp — printed fields plus a scribbled
signature/stamp — that return the image *and* ground-truth `{value, bbox}` per field for free.
That gives deterministic fixtures for the whole pipeline and labeled truth for the eval.

**Q: What does the eval actually measure?**
Three dimensions against ground truth: **field accuracy** (>0.7), **signature recall** (>0.9 —
missing a real signature is the costly error), and **grounding box IoU** (>0.3). It's
**opt-in** (`RUN_AI_EVAL=1`) and **skipped in CI** because it makes real paid API calls and
needs a key — CI stays free and deterministic; the eval is run deliberately.

**Q: Isn't a mock eval cheating?**
It proves the *plumbing and logic* end-to-end on a clean substrate — extraction schema,
grounding math, reconciliation, audit. Real-photo robustness (crumpled, rotated, low-light) is
explicitly a **later production-trust gate**, not a build blocker. Being honest about that
boundary is the point.

---

## 7. Data model & scalability

**Q: How much schema did the AI layer add?**
**Zero migrations.** Tier-1's `load_documents.extracted` jsonb was designed up front to store
per-field `{value, source, checks}` with a comment that "Tier-2 bbox grounding slots in with no
migration." The AI layer just fills `source: 'vlm'`, adds `verbatim` + `bbox`, and flips to
`'human'` on correction — reusing the exact structure the deterministic tier already wrote.

**Q: Per-field `source` — why does that matter?**
Provenance. Every field knows whether it came from `qr`, `vlm`, or `human`. A human edit flips
that field to `human` while untouched fields stay `vlm`, so you always know which values a person
vouched for — essential for an auditable, invoiceable record.

---

## 8. Cost, privacy, trade-offs

**Q: What's the real-world cost/privacy trade-off?**
The guía image + associated business data are sent to Anthropic — a **conscious data-sharing
choice**, documented. Cost is bounded by the on-demand design (one call per human-reviewed doc,
not per inbound photo).

**Q: What would you do differently / next?**
(1) A **golden set of real guías** to replace the mock eval as the regression suite. (2)
Per-field **confidence calibration** so amber/green can eventually reduce human load on the
easy 80%. (3) **Few-shot** examples per client layout once we've collected corrections. (4) Tune
the quality-gate thresholds (`LUMA_MAX`, blur) on real phone photos — currently provisional.

**Q: Biggest risk in production?**
Over-trusting the model on edge cases (handwriting, stamps over text, rotated photos). The whole
design mitigates it structurally: evidence-based confidence, grounding as provenance,
reconciliation against known truth, and a mandatory human confirm. The AI can be wrong and the
system still can't silently record a bad delivery.

---

## Curveballs

- **"Why not fine-tune a model?"** — We're not training anything; a pre-trained Claude via API is
  cheaper, faster to ship, and improves for free. The moat is the deterministic harness (reconciliation
  + audit + review UX), not model weights. With ~15 clients there isn't enough data to fine-tune well anyway.
- **"Why not skip OCR and trust the VLM's boxes?"** — VLM coordinates are unreliable; a separate OCR
  pass + string match gives independent, verifiable provenance.
- **"What breaks first on a real photo?"** — the quality gate (a pure-white mock reads luma ~253 and
  trips `LUMA_MAX=245`); then accent/format edge cases in reconciliation (now handled); then handwriting
  grounding. None silently corrupt data — they degrade to "human verifies."
- **"How is this not just an OCR wrapper?"** — the value is the *decision layer*: three-way reconciliation
  against a load we created, evidence-based confidence, and a 100%-human-confirm audit trail. The read is the
  cheap part.
