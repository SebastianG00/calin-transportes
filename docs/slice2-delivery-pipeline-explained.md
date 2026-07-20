# Slice 2 — Delivery & Document Pipeline, explained simply

> A plain-English guide to **what Slice 2 does, how it works, and why we built it this way.**
> Written so anyone (including you, six months from now) can read it and understand — and
> defend — every design choice. No code here, just the ideas.

---

## 1. The problem we're solving

Transportes Kalin hauls cargo. When a driver delivers a load, the client hands over a signed
**guía de remisión** — the official shipping document that proves the delivery happened and
records what was delivered.

Today, the office has to **manually check that paper**: is it for the right client? the right
date? is it valid? Then file it and mark the load delivered. It's slow, error-prone, and easy
to lose track of.

**Slice 2 turns that manual paper-checking into a fast, trustworthy, mostly-automatic pipeline.**

The goal in one line:

> **A photo of the guía comes in → the system reads it, checks it against the load we expected →
> a human confirms it → the load flips to "Entregado."**

---

## 2. The one-picture overview

```
  📄 Guía (paper, with a SUNAT QR printed on it)
        │
        │  someone takes a photo of it
        ▼
  ┌───────────────────────────────────────────────────────────┐
  │  THE PIPELINE  (runs on our server, automatically)         │
  │                                                            │
  │  1. Is the photo good enough? (not blurry/dark)            │
  │  2. Read the QR → get the document's real data             │
  │  3. Check that data:                                       │
  │       • is the RUC/number/date well-formed? (checksums)    │
  │       • does it MATCH the load we created? (reconcile)     │
  │  4. Mark it green / amber / red                            │
  │  5. Save it and put it in the "Revisión" queue             │
  └───────────────────────────────────────────────────────────┘
        │
        ▼
  👤 A person opens "Revisión", sees the photo + the extracted data
     side by side, fixes anything, and clicks "Confirmar"
        │
        ▼
  ✅ The load becomes "Entregado" — and every step was logged.
```

That's the whole thing. The rest of this doc explains each piece and **why** we chose to build
it that way.

---

## 3. How the photo gets in (intake) — and why it's NOT WhatsApp-dependent

A common confusion: "if we can't use WhatsApp, how does this work?"

**The photo can arrive two ways, and Slice 2 uses the one that needs no WhatsApp:**

- **✅ Tier 1 (what we build now): the office "Subir guía" button.** Someone in the office
  photographs or scans the guía and uploads it right in the web panel. Done. No WhatsApp needed
  at all — to build it, test it, or even run it in production.

- **⏳ Later (optional): the driver sends it over WhatsApp.** WhatsApp has two directions, and
  only one is blocked:
  - **Outbound** (us *sending* messages to drivers) — blocked; needs paid Twilio + approved
    templates.
  - **Inbound** (driver *sending us* a photo) — **works even on the free plan.**

  So even the WhatsApp path is available later without paying — and when we add it, the photo
  drops into **the exact same pipeline** the upload button uses. No rework.

**Design choice — why "channel-agnostic" intake:** the pipeline doesn't care *how* the photo
arrived. It just processes "a photo attached to a load." That means the office-upload path and
the future WhatsApp path share 100% of the logic. We build once.

---

## 4. The QR — our free, exact source of the document's data

### What it actually is

The square of pixels on the guía is a **normal QR code** — same technology you scan with your
phone. A QR code is just **text stored as a scannable picture.** Decoding it gives you back that
text; nothing "happens" automatically.

SUNAT (Peru's tax authority) **prints a QR on every guía** and packs the document's real data
inside it, as a simple text string:

```
20100047218 | 09 | T001 | 55 | 2026-07-18 | 20131312955
    RUC      tipo  serie  núm    fecha       RUC destino
```

### Why we need it

To verify a delivery, the office needs the **data off the guía** (RUC, number, date). Without
the QR, that means **a human squints at the paper and types it in** (slow, mistakes) or **an AI
reads the photo** (that's Tier 2 — costs money, can be wrong).

But SUNAT already put that data in the QR. So:

> **The QR is a shortcut: it hands us the document's true data instantly and exactly — no typing,
> no AI, no guessing.**

We read the QR from the photo's pixels, get the text, and pull out the fields. That's the whole
"QR step." Nothing is "triggered" — we just read data.

**Design choice — why lean on the QR first:** it's *deterministic* (same input → same output,
always), free, and exact. It's the highest-trust, lowest-cost way to get the document's data.
Everything else (AI) is only needed for the fields the QR *doesn't* contain.

---

## 5. The two tiers — and why we split them

Slice 2 is big, so we split it into two tiers. **This split is the single most important design
decision.**

### Tier 1 — Deterministic (no AI). *We build this first.*

Everything that can be checked with **exact, rule-based logic**:
- Read the QR (exact data).
- **Checksums & format** — is the RUC mathematically valid? (RUC has a built-in check digit, like
  a credit-card number.) Is the serie-número shaped right? Is the date real and not in the future?
- **Reconciliation** — does the guía's data **match the load we created**? We *made* the load, so
  we already know the true client RUC and the expected date. If the guía's RUC doesn't match the
  client's RUC, something's wrong → flag it.
- **Human review queue** — every document goes to a person to confirm.

No AI anywhere. Predictable, cheap, testable, trustworthy.

### Tier 2 — AI (the upgrade). *Separate, comes later.*

For the fields the QR **doesn't** contain (like the weight/peso, or reading a handwritten note),
and for documents where the QR is missing or damaged:
- **Claude Vision** (an AI that can "look at" the photo) reads those fields off the image.
- **OCR + bounding-box grounding** (explained below) so we can *see where on the photo* each AI
  answer came from.
- A review **workbench** that highlights those spots.
- **Evals** — a test set of ~40 real guías to measure how accurate the AI is.

**Why split this way (the rationale to remember):**

1. **De-risk the hard part.** The AI part is expensive, non-deterministic, and needs real photos +
   an accuracy-measurement harness. If we mixed it in from day one, we couldn't tell whether a
   bug was in *our logic* or in *the AI*. Tier 1 gives us a rock-solid, fully-tested foundation
   first.
2. **Most of the value needs no AI.** The QR already gives us the critical fields (who, what
   number, what date). Reconciling those against the load catches the important errors. We ship
   real value in Tier 1 alone.
3. **The AI plugs into the same rails.** In Tier 2, the AI's answers flow through the **exact same
   validators** Tier 1 built. AI doesn't replace our checks — it just fills in more fields, and
   those fields still get checked deterministically.

---

## 6. What "grounding" and "OCR" mean (in simple terms)

These sound fancy; the ideas are simple.

### OCR
**OCR = "reading text out of an image."** Optical Character Recognition. When Tier 2's AI (or an
OCR tool) looks at the photo and says "the weight is 8,900 kg," OCR is the act of turning pixels
of printed text into actual characters.

### Grounding (this is the trust mechanism)

**Grounding = "show me *where* that answer came from."**

Imagine the AI says "the weight is 8,900 kg." How do you trust it? You want it to **point at the
exact spot on the photo** where it read that — like a person putting their finger on the line and
saying "right here."

That "finger on the exact spot" is a **bounding box** — a little rectangle drawn around the place
on the image where the value was found. So in Tier 2, the review screen can show the photo with a
box highlighting *"this is where I read 8,900 from."* The human glances, confirms, done.

> **Grounding turns "the AI says X" (trust me) into "the AI says X, and here's the exact spot on
> the paper" (verify me).** That's what makes an AI answer safe to rely on.

### Two kinds of grounding in our system

We actually use grounding in **both** tiers — just different sources of truth:

- **Tier 1 — "provenance" grounding (no AI):** every field we save is tagged with *where it came
  from*. Right now that's `source: "qr"` (it came from the QR) or `source: "human"` (a person
  typed/corrected it). So even in Tier 1, nothing is a mystery — every value has a traceable
  origin.
- **Tier 2 — "visual" grounding (AI):** the AI's fields additionally get a **bounding box** on the
  photo. That's the "finger on the spot" version.

**Design choice — why we record provenance from day one:** Tier 1's data model already has a slot
for "where did this field come from." So when Tier 2 adds bounding boxes, it just fills in more of
that same slot — **no database migration, no rework.** We designed the Tier-1 foundation to be
Tier-2-ready.

---

## 7. Reconciliation — the heart of Tier 1

This is the clever, high-value part, so it's worth stating plainly.

**We didn't receive this load out of nowhere — *we created it.*** When the office assigned the
load, they picked the client, the date, the cargo. So the system **already knows the truth**
about what this delivery should be.

So when a guía photo comes in, we don't just read it — we **cross-check it against the load we
already have:**

- Does the guía's RUC == the client's RUC we assigned? (must match exactly)
- Is the guía's date within the delivery window of the scheduled date?

This is called **3-way reconciliation**: the load we created ↔ the QR on the paper ↔ (later) what
a human/AI reads. When they agree → ✅ green. When they don't → a clear, plain-Spanish flag like
*"RUC del guía ≠ RUC del cliente."*

**Design choice — why this beats "just read the document":** anyone can read a document. The value
is **catching mistakes** — a driver photographing the *wrong* guía, a mismatched client, a
wrong-date document. Because *we hold the ground truth* (the load), we can catch those
automatically. That's the differentiator.

---

## 8. The human review queue ("Revisión") — and why 100% human confirm

Every processed document lands in a **Revisión** screen. A person sees:
- The **photo** of the guía, next to
- The **extracted fields** (from the QR), with
- **Green/amber/red flags** and plain-Spanish explanations of anything off.

They fix anything wrong, fill in fields the QR didn't have (like weight), and click **Confirmar**
— which attaches the document to the load, flips it to **Entregado**, and logs everything.

**Design choice — why a human confirms *every* document (for now):**

The system **annotates** (green/amber/red) but **never auto-accepts.** Even a green document waits
for a human click. Why?

1. **Trust while we're new.** Until we've proven the pipeline on real documents, a human is the
   safety net. Better slow-and-right than fast-and-wrong on legal delivery records.
2. **It builds our test set.** Every human confirmation and correction is logged. That log becomes
   the "golden" dataset we use later to measure accuracy — and eventually to *earn* the right to
   auto-accept high-confidence documents (a future tier).
3. **The validation never mutates anything.** The automatic checks only *annotate*; only a human
   *changes* data. So the machine can never silently "fix" a legal document — a person always
   makes the call.

---

## 9. How we build and test it *without real guía photos*

We don't have real guía photos yet. Waiting for them would block everything. So:

**We generate synthetic guías** — blank white "sheets" with a real **SUNAT-format QR** generated
onto them. We upload those through the real pipeline and check: does a valid QR produce a green,
correctly-classified document? Does a blurry one get rejected? Does a wrong-RUC one get flagged?
Does a re-sent duplicate get caught? All provable, today, with zero real photos and zero WhatsApp.

**Design choice — why synthetic-first:** it lets us build and fully test the entire pipeline now,
deterministically. When real photos arrive, we only need to *tune constants* (the exact QR field
order, the blur threshold) — not rewrite logic. We deliberately kept those tunable values in
clearly-marked "PROVISIONAL" constants for exactly this reason.

---

## 10. Some smaller design choices worth knowing

| Choice | Why |
|---|---|
| **Deterministic (Tier 1) before AI (Tier 2)** | Build a trustworthy, fully-tested foundation first; isolate the expensive/uncertain AI part so bugs are attributable. |
| **Office upload as the primary intake** | Works with zero WhatsApp cost or setup; the WhatsApp path reuses the same pipeline later. |
| **Lean on the SUNAT QR** | Free, exact, deterministic source of the document's core data — no typing, no AI needed for it. |
| **Reconcile against the load we created** | We own the ground truth, so we can *catch mistakes* automatically — the real value, not just "reading" the doc. |
| **Record provenance (`source`) from day one** | Tier-2 bounding boxes slot into the same field with no database rework. |
| **100% human confirmation** | Safety while new + builds the accuracy dataset + machine never silently edits a legal record. |
| **Validation only annotates, never mutates** | Only humans change data; the automatic checks can only flag, never alter. |
| **Synthetic guías for testing** | Unblocks full end-to-end testing now; real photos later only tune constants, not logic. |
| **Pure-JavaScript image libraries** | This repo lives on iCloud, where heavier "native" libraries break the build. Pure-JS avoids that whole class of problem. |
| **Everything logged (append-only audit)** | Every verdict and correction is recorded — for auditing today and for measuring/improving accuracy tomorrow. |

---

## 11. If someone asks you "why did you build it this way?"

Short answers you can give with confidence:

- **"Why not just use AI to read the documents?"** — Because the most important data is already in
  the SUNAT QR, exactly and for free. AI is expensive and can be wrong, so we only bring it in
  (Tier 2) for the fields the QR *can't* give us — and even then its answers get checked by the
  same deterministic rules.

- **"Why does a human confirm everything?"** — These are legal delivery records. Until we've proven
  accuracy on real documents, a human is the safety net — and every confirmation builds the dataset
  that lets us safely automate more later.

- **"Why build it before you have real photos or WhatsApp?"** — Because the pipeline is
  channel-agnostic and testable with synthetic guías. We de-risk and prove the whole flow now;
  real photos and WhatsApp plug in later with no rework.

- **"What's the actual smart part?"** — Reconciliation. We created the load, so we know the truth.
  Matching the guía against it catches the *mistakes* — wrong client, wrong date, wrong document —
  automatically. That's the differentiator, not just "reading a document."

- **"What is grounding?"** — Making every answer traceable to where it came from: in Tier 1, a
  `source` tag (QR vs human); in Tier 2, a box on the photo showing exactly where the AI read a
  value. It turns "trust me" into "verify me."

---

*This document covers the design intent. The step-by-step build plan lives in the (internal)
implementation plan; the approved design spec has the precise technical decisions.*
