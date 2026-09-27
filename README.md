# Kashif (كاشف) — Privacy-First Social Engineering Defense & Exposure Audit

> **"Discover what a stranger could learn about you — before they use it against you."**

Built for **GOMYCODE × NVIDIA — Come Build with AI**, 27 September 2026.

---

##  The Problem

Moroccans are targeted daily by social-engineering scams delivered via WhatsApp, SMS, and social media: fake lottery/prize messages demanding a verification code, fake CNSS/CNOPS/DGI refund notices, fake Amana/Chronopost/Poste delivery-fee requests, fake bank OTP calls, fake job offers requiring upfront fees, Avito marketplace fraud, romance scams, and phishing "your account is blocked" links.

These scams succeed because they're **personalized** — using information victims unknowingly expose on their own social media: their city, employer, routine, family, and habits. Most anti-scam tools are generic or reactive. None of them show users, in advance, exactly what an attacker could learn about *them specifically* — including things they've long forgotten they ever posted.

##  The Solution

Kashif is a two-module privacy companion:

### 1. Exposure Check
- **Audit complet (Full Scan)** — Upload your official platform data export (.zip from Instagram/Facebook/TikTok's own "Download Your Information" feature, no password needed) for a complete audit: every post, caption, comment, location history, tagged photo, and search query — including things you've forgotten. Computes a 0–100 exposure score, realistic attack-path simulations, and a prioritized fix checklist.
- **Vérifier avant de publier (Pre-Publish Check)** — Upload 1–3 screenshots or a short video of a post you're *about to* publish, and Kashif tells you what it reveals — location clues, visible documents, routine patterns, GPS metadata — before it's public, with concrete edits ("blur the license plate," "crop out the visible badge") rather than after-the-fact fixes.

### 2. Scam Shield
Paste or screenshot a suspicious message (Darija, Arabic, French, English) and get an instant verdict — **Safe / Suspicious / Scam** — with the exact red-flag phrases highlighted, a plain-language explanation, and concrete next steps.

**The two modules connect**: once you've run an Exposure Check, Scam Shield cross-references incoming messages against your own exposed information to flag when a scam is *personalized* using details you unknowingly made public.

---

##  Why We Use Official Data Exports, Not Scraping

We never ask for passwords or login credentials, and we never scrape social media. Instead, we use each platform's own official data-export feature — a right every user already has. This is:
- **More complete** than scraping could ever be (includes deleted content, private search history, years of data)
- **Zero credential risk** — no password ever touches our app
- **ToS-compliant** — scraping violates every major platform's terms and risks account bans

##  Ownership Verification

To prevent misuse, users verify control of an email via a one-time 6-digit code before a Full Scan unlocks. This mirrors the same trust model platforms use for account recovery: if you control the linked email, you can already reset the account. We label this honestly as **"Verified via email,"** not "account ownership proven."

---

##  AI Architecture

**Multi-provider by design.** A single backend abstraction (`call_llm()`) is built to route AI calls to a configurable provider — currently wired to **Google Gemini** via AI Studio, with the same abstraction ready to point at Groq or NVIDIA Brev with a single environment-variable change and no code rewrite. This was a deliberate reliability decision after repeatedly hitting free-tier quota limits on Gemini during development: rather than hardcoding one vendor, we built the app so a provider swap never touches business logic.

**Guardrail layer.** A deterministic, multilingual keyword-rule system runs alongside the LLM and can only *escalate* a verdict, never downgrade it — e.g., any message combining a "you won" hook with a request for an ID number or fee is force-classified as a scam regardless of what the LLM alone concluded. This was added after discovering the LLM alone could occasionally misjudge an obvious scam; the guardrail is a safety net, not a replacement.

**Deterministic scoring.** The exposure score is computed by code from weighted findings (GPS metadata, visible ID documents, and children's faces weighted highest) — never invented by the LLM directly, keeping it auditable and reproducible.

**Vision + audio pipeline.** Extracts text, location clues, visible documents, and context from screenshots; for video, extracts key frames and transcribes the audio track to catch spoken exposure risks too.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (built in Google AI Studio), static build |
| Backend | Python, FastAPI |
| AI provider | Google Gemini (via AI Studio) |
| Image processing | Pillow (EXIF/GPS), OpenCV (frame extraction, QR/barcode decode) |
| Data parsing | Native Python `zipfile`/`json` (no AI needed for raw export text) |
| Deployment | Single service serving both frontend + API (no CORS) |

### Running locally
```bash
git clone <repo-url>
cd kashif
pip install -r backend/requirements.txt
cd frontend && npm install && npm run build && cd ..

export LLM_PROVIDER=gemini
export GEMINI_API_KEY=your_key
export GEMINI_MODEL=your_model

uvicorn backend.main:app --host 0.0.0.0 --port 8080
```
Visit `http://localhost:8080`.

---

## Responsible AI & Privacy

- **Zero persistence** — all processing happens in memory; nothing is written to a database. A "Purger la session" button wipes everything on demand.
- **No passwords, no scraping**, anywhere in the product.
- **Sensitive data masked** in outputs (phone numbers, IDs shown as `06****1234`).
- Every result carries a visible confidence indicator and **"AI can be wrong — you decide."** Scam Shield advises; it never blocks or acts automatically.
- **Synthetic demo profiles** (procedurally generated, no real people) are used for public demonstrations.

---

## Testing & Reliability

A live Reliability page benchmarks the real backend against 20 development + 20 **held-out** test messages (never used to write the prompts), covering Darija (Arabic and Latin script), Arabic, French, and English — including legitimate messages that mention codes/money/links to specifically test for false positives. Reports accuracy, false-positive/negative rates, and per-case latency, including failures — not just successes.

---

## AI Tool & Model Disclosure

- **Model used:** Google Gemini, accessed via Google AI Studio, for both vision (screenshot/video-frame analysis) and text (scam classification, explanations, attack-path simulation).
- **NVIDIA Brev:** not used. We did not receive Brev allocation for this event; the app was built with a provider-agnostic architecture from the start, so it can run on Brev, Groq, or Gemini interchangeably — for this submission it runs entirely on Gemini.
- **Datasets:** none external; synthetic test profiles generated procedurally for demo/testing purposes only; user-provided data is processed live, never stored.
- **Architecture note:** the app's AI calls are routed through a single provider-agnostic function rather than calling Gemini directly throughout the codebase, so a production version could run the same code against Groq or a self-hosted model without any logic changes.
- **Actual AI contribution:** vision-language extraction from screenshots/video frames, scam-message classification grounded in a curated pattern knowledge base, natural-language explanations and attack-path simulations. Scoring itself is deterministic code, not AI-generated, for auditability.
---

## Prize Fit

**Country podium:** a working, tested, privacy-conscious AI product solving a daily real-world problem in Morocco.

**GOMYCODE × NVIDIA Real-World AI Impact Award:** Kashif directly protects everyday users — not businesses — from financial and identity harm, using AI grounded in real, documented Moroccan scam patterns.

**CompTIA Skills & Technical Readiness Award:** the guardrail-escalation architecture, deterministic scoring, provider-agnostic design, and held-out test evaluation reflect a security-conscious, responsibly engineered build rather than a thin AI wrapper.

---

##  What's Next

- Community-reported scam pattern submissions
- WhatsApp chat export and Google Takeout support
- A browser extension for real-time link/message checking
- Deeper personalization-risk detection linking Scam Shield to exposure history over time

---

##  Team

| Name | Role |
|---|---|
| *EL BADDAD IBTISSAM* | Frontend |
| *RABII NOUHAILA* | Backend |
| *MAROUANE DOAA* | Presentation & design |
| *TOUAB HAJAR* | Demo |
| *EL OUMARI AICHA* | Research & AI enhancement |

---

**Built in 11 hours for Come Build with AI (GOMYCODE × NVIDIA), 27 September 2026.**
