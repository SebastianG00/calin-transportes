# Slice 2 · Tier 2 — the AI layer, explained simply

> Plain-English guide to what Tier 2 adds, how it works, and the decisions we need to make.
> Read this to understand the whole process before we write the spec. No code — just the ideas.
> (Companion to `docs/slice2-delivery-pipeline-explained.md`, which covers Tier 1.)

---

## 0. First, the thing that caused confusion: **we are NOT training a model**

This is the most important point, so it goes first.

- Claude's vision model is **already trained** by Anthropic. It already knows how to read text
  and understand images.
- We **do not train it, fine-tune it, or teach it** with our photos. We just **call it over the
  internet (an API)**: we send it *one guía image + written instructions*, and it sends back the
  answer. Like texting a very smart assistant a photo and asking "what's the weight on this?"
- So there is **no "training data"** to collect. When I earlier said "we need photos," I did **not**
  mean training. I meant something different (testing) — explained in §7.

Keep this in mind the whole way down: **Tier 2 = we make API calls to a pre-trained Claude.**

---

## 1. Where Tier 1 ended, and what Tier 2 adds

**Tier 1 (done):** a guía photo → read the **QR** → check it with math (RUC checksum, dates) →
compare against the load → a human confirms → load *Entregado*. Deterministic, no AI.

**The limit of Tier 1:** the QR only contains a few fields (RUC, doc number, date). It says
**nothing** about the *weight*, the *destination as written*, the *plate*, the *items*, or anything
handwritten/stamped. And if a guía has **no readable QR** (old format, damaged, bad photo), Tier 1
can only file it as "sin clasificar" for a human to type in by hand.

**Tier 2 adds the AI layer to fill exactly those gaps:**
1. **Read the fields the QR can't give us** — using Claude's vision (the "VLM").
2. **Prove where each answer came from** on the photo — "grounding" with bounding boxes.
3. **A review workbench** — the photo with the AI's answers highlighted, so a human checks fast.
4. **Evals** — a way to measure how often the AI is right, so we can trust it and improve safely.

Everything the AI produces still flows through **Tier 1's deterministic checks**. The AI doesn't
replace our safety net — it feeds into it.

---

## 2. What the VLM actually does (Stage 4)

**VLM = "Vision-Language Model"** = an AI that can look at an image *and* read/write text. Claude
is one.

On a guía, we send Claude:
- the **photo**,
- the **QR data we already decoded** (so it doesn't have to guess the RUC/number),
- the **load record** (what we expected — client, destination, weight),
- **instructions**: "Return these fields as strict JSON: peso, destino, placa, …"

Claude replies with structured data, e.g.:
```
{ "peso_kg": "8900", "destino": "Arequipa", "placa": "ABC-123", "items": "Cerveza x300" }
```

**How this differs from the QR:** the QR is *exact and free* but limited to a few fields. The VLM
*reads the rest of the paper* (including messy/handwritten parts) but **can be wrong** — it's a
smart reader, not a guarantee. That's why everything it returns gets checked (next sections).

**Settings that keep it honest:** we ask for strict JSON (not free text), "temperature 0" (least
random/most consistent answers), and we seed it with the QR + load so it has real context.

---

## 3. "Grounding" and bounding boxes (Stage 5.1) — the trust mechanism

The problem: Claude says *"peso = 8900."* How do you trust that? Maybe it misread. Maybe it made
it up.

**Grounding = making the AI point at exactly where on the photo it read that.** A **bounding box**
is just a little rectangle drawn around that spot on the image — like putting your finger on the
line and saying *"right here."*

How we do it (deterministically, no second AI):
- Run **OCR** on the photo once. *(OCR = "reading text out of an image" — it returns every piece of
  text it finds **plus the box where each one sits**.)*
- For each field Claude gave us, **find that value in the OCR text** and grab its box.
  - **Found it** → attach the box. Now the review screen can highlight it, and we *trust it more*.
  - **Didn't find it** → mark it "not grounded" → **cap its confidence low / force amber** so a
    human definitely checks it. (Not automatically wrong — e.g. handwriting often fails OCR but
    Claude may read it correctly. It just means "unverified, needs eyes.")

**Why bother?** Two payoffs:
1. **For the human:** the review screen highlights each answer on the photo → checking is a glance,
   not a hunt.
2. **For trust:** confidence comes from **independent evidence** (did OCR independently find the
   same text?), **not** from the AI's own say-so. A model that's confidently wrong can't fool a
   check that looks at the actual pixels.

*(This is a genuine design decision we'll make in the spec: which OCR to use — a free one like
Tesseract, or a paid, more-accurate one like Google Vision. Trade-off: cost vs accuracy on
stamped Spanish documents.)*

---

## 4. Confidence & routing (Stage 6) — green / amber / red, from *evidence*

Tier 1 already turns checks into **green / amber / red**. Tier 2 feeds more evidence in, per field:
- Did **OCR independently find** this value on the photo? (grounded or not)
- Did it pass the **format/checksum** rules? (RUC math, date sane, plate shape)
- Does it **reconcile** with the load? (plate == assigned unit, destination matches, weight in range)

**Core principle:** *confidence is computed from this evidence, never from the model saying "I'm
sure."* All of it folds into the per-field color.

**Launch policy stays: 100% human confirmation.** Even a green field waits for a human click. We
only *loosen* that later — and only if the evals (next) prove the AI is reliable enough.

---

## 5. The review workbench (Stage 7)

An upgrade of the Tier-1 Revisión screen. Side-by-side:
- the **photo with bounding-box highlights**, and
- the **form of extracted fields**.

Click a field → the photo **zooms to that box**. Keyboard-first so the office flies through it.
Every correction is logged (field, old → new, who, when) — the same audit trail we already have,
now richer.

---

## 6. Everything still ends in the human + the audit trail

Nothing here removes the human. The AI **proposes**; the human **disposes**. And every proposal,
every correction, every confirm is recorded — which is both the legal audit trail **and** the raw
material for the evals below.

---

## 7. Evals & the "golden set" (Stage 8) — **this is why I mentioned photos**

Here's the honest reason photos come up — and it's about **testing**, not training.

**An eval is a test that measures how often the AI is right.** To run it, you need examples where
**you already know the correct answer** — so you can compare the AI's answer to the truth and count
mistakes.

- A **"golden set"** = a folder of **~40 real guía photos** that a human has **labeled** with the
  correct fields (the real peso, destino, placa, …).
- We run the AI over all 40, compare to the labels, and get a **scorecard**: "peso correct 95% of
  the time, destino 88%, …"
- Then, whenever we change the prompt or the model, we **re-run the 40** to make sure we didn't make
  it worse. (This is called a *regression suite* — it catches you accidentally breaking things.)

**Why real photos, specifically?** Our **synthetic** guías (white sheet + a QR) have **no real
printed fields, handwriting, stamps, lighting, or layout quirks** — so they can't test whether the
AI reads a *real* messy guía correctly. Only real ones can.

**Why this is a *later* step (your instinct was right):** we can **build** the whole pipeline +
workbench against synthetic + our knowledge of SUNAT guías. We only need the ~40 real ones to
**verify** it works and to **tune** the prompt. A *handful* (3–10) during the build makes the prompt
sharper, but the big set is a verify-phase thing.

---

## 8. Cost & privacy — the two real-world trade-offs

**Cost:** each guía is an **API call to Claude** (and maybe one to an OCR service). That costs a
small amount of money **per photo**. Not huge, but it's per-document and worth being aware of — one
reason we only call the VLM for what the QR *can't* already tell us (don't pay the AI to re-read the
RUC we got for free).

**Privacy/data:** a guía contains **client and business information**, and Tier 2 **sends that image
to an external service** (Anthropic's API, and possibly an OCR provider). That's a real data-sharing
decision — it's fine for most businesses and it's how you're already using Claude, but it should be a
*conscious* choice, and we note it in the spec. (The image already lives in our private bucket; Tier 2
adds "and a copy is sent to the API when we process it.")

---

## 9. The plan from here (how we actually proceed)

1. **Spec** (what we're doing now, via brainstorming) — lock the decisions: OCR choice, which fields
   the VLM extracts, the confidence formula, the workbench depth, the eval rubric, cost/privacy.
2. **Writing-plans** — turn the spec into a step-by-step build plan (like we did for Tier 1).
3. **Build** — increment by increment, against synthetic + a few real photos, with reviews.
4. **Eval** — once ~40 real labeled guías exist, run the scorecard; tune; decide if/when to loosen
   the 100%-human-confirm policy.

**Bottom line:** we're not training anything; we call a pre-trained Claude, wrap it in deterministic
checks + grounding so we can trust it, let a human confirm, and use a set of real labeled photos
**to test** it — mostly later, not to build.

---

## Open decisions for the spec (what I'll ask you about)
- **OCR engine** for grounding: free (Tesseract) vs paid/accurate (Google Vision) — cost vs quality.
- **Which fields** the VLM extracts (peso, destino, placa, items, …) and which ones we *reconcile*
  (note: full weight/destination tolerance is per-client = Slice 3; Tier 2 does basic reconciliation).
- **Claude model** to use for vision (default: latest capable).
- **Workbench depth** for v1 (full zoom + keyboard-first, or simpler highlights).
- **Eval rubric** — exact-match vs normalized-match per field; how we label the golden set.
- **When we call the VLM** — always for non-QR fields, or only when the QR is missing/failed.
- **Cost & privacy** sign-off — sending guías to external APIs.
