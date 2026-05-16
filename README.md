# CareFirst Health — Patient Intake & AI Appointment Confirmation

> **Tagline:** Your care, confirmed in seconds.

A fictional multi-specialty clinic demo that lets a patient fill in a short intake form and receive a **personalized, AI-generated confirmation email** within 60 seconds — fully automated, zero manual intervention.

---

## Overview

| | |
|---|---|
| **Version** | 1.0 |
| **Status** | Ready for Build |
| **Date** | 16 May 2026 |

### What it does

1. Patient fills a short form (name, email, age, concern, slot, optional note)
2. Form POSTs to the Node.js server
3. Server calls **OpenAI GPT-4o** with a concern-specific prompt
4. AI returns a personalized email body
5. Server forwards the payload to **Make.com**
6. Make.com sends the email via **Gmail** to the patient

### Specialties supported

| Concern | Pre-visit instructions |
|---|---|
| 🩺 General Checkup | Fast 8 hrs, bring ID/insurance, list meds, comfortable clothing, arrive early |
| 🦷 Dental | Brush & floss, note pain/sensitivity, avoid eating 2 hrs before, list meds |
| 🦴 Ortho | Bring X-rays/scans, loose clothing, pain scale 1–10, no strenuous activity |
| 🧠 Mental Health | Arrive calm, bring notes on feelings, complete intake form, HIPAA confidentiality |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML + CSS + Vanilla JS (single file) |
| Backend | Node.js + Express |
| AI | OpenAI GPT-4o |
| Automation | Make.com |
| Email delivery | Gmail (via Make.com) |

---

## Project Structure

```
care-first/
├── README.md
└── server/
    ├── public/
    │   └── index.html       # Patient intake form — served at localhost:3000
    ├── index.js             # Express server — serves UI, /intake route, OpenAI call, Make.com handoff
    ├── prompts.js           # System prompt + concern-specific instruction sets
    ├── package.json
    ├── .env                 # Your secrets (gitignored)
    └── .env.example         # Template — copy this to .env
```

---

## Setup & Installation

### Prerequisites

- Node.js v18+
- An OpenAI account with a valid API key
- A Make.com account with a configured scenario (see below)

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `server/.env` and fill in:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
MAKE_WEBHOOK_URL=https://hook.us2.make.com/your_webhook_id_here
PORT=3000
```

- Get your OpenAI key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Get your Make.com webhook URL after setting up the scenario (see below)

---

## Make.com Scenario Setup

### Step 1 — Create a new scenario

1. Log in to [make.com](https://make.com)
2. Click **Scenarios** → **+ Create a new scenario**

### Step 2 — Add the Webhook trigger

1. Click the **+** circle on the blank canvas
2. Search **Webhooks** → select **Custom Webhook**
3. Click **Add** → name it `CareFirst Intake` → click **Save**
4. Copy the generated webhook URL and paste it into `server/.env` as `MAKE_WEBHOOK_URL`

### Step 3 — Teach Make.com the data shape

1. Click **Run once** (bottom left of the canvas)
2. In a terminal, send a test payload to your webhook URL:

```bash
curl -X POST https://hook.us2.make.com/YOUR_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Priya",
    "last_name": "Sharma",
    "email": "test@example.com",
    "concern": "Dental",
    "slot": "Mon–Tue, 9–11 AM",
    "email_subject": "Your CareFirst Appointment is Confirmed, Priya!",
    "email_body": "Dear Priya, your Dental appointment is confirmed for Mon–Tue, 9–11 AM."
  }'
```

3. Make.com shows **"Successfully determined"** — click **OK**

### Step 4 — Add Gmail module

1. Click **+** to the right of the Webhooks bubble
2. Search **Gmail** → select **Send an Email**
3. Click **Add** and authorize your Google account

### Step 5 — Map the fields

| Gmail field | Value |
|---|---|
| To | `email` (from webhook data) |
| Subject | `email_subject` (from webhook data) |
| Content | `email_body` (from webhook data) |
| Content Type | `Text` |
| From Name | `CareFirst Health` |
| Reply-To | `appointments@carefirsthealth.com` |

### Step 6 — Save & activate

1. Click **Save**
2. Toggle the scenario **ON** (bottom left, turns blue)
3. Set scheduling to **Instantly**

---

## Test Walkthrough

### Step 1 — Start the server

```bash
cd server
npm run dev
```

Expected output:
```
CareFirst server running on http://localhost:3000
```

### Step 2 — Open the form

Visit [http://localhost:3000](http://localhost:3000) in your browser. The landing page is served directly by Express — no need to open any file manually.

### Step 3 — Submit the form

Fill in all fields using your **real email address**, then click **Confirm my appointment**.

- Loading spinner appears → then the green success state
- Check the server terminal — no `Intake error:` lines means all good

### Step 4 — Check your inbox

Within **60 seconds** you should receive an email with:

- Subject: `Your CareFirst Appointment is Confirmed, [First Name]!`
- 3–5 concern-specific pre-visit instructions
- Closing: `Warm regards, The CareFirst Team`

### Quick smoke test via curl

You can also bypass the form and hit the server directly:

```bash
curl -X POST http://localhost:3000/intake \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Priya",
    "last_name": "Sharma",
    "email": "your@email.com",
    "age": "32",
    "concern": "Mental Health",
    "slot": "Fri, 9 AM–12 PM",
    "note": "Feeling anxious about work lately"
  }'
```

Expected response: `{"success":true}`

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Spinner never stops | Server not running | Run `npm run dev` in `server/` |
| Alert with phone number | Server error | Check terminal for `Intake error:` log |
| Email doesn't arrive | Make.com scenario is OFF | Toggle it ON, set to Instantly |
| Email arrives but is generic | Wrong concern value | Confirm one of: `General Checkup`, `Dental`, `Ortho`, `Mental Health` |
| `401` from OpenAI | Invalid API key | Check `OPENAI_API_KEY` in `.env` |

---

## Acceptance Criteria

- [ ] Form submits with success confirmation message
- [ ] Server responds within 5 seconds
- [ ] AI generates a non-generic, concern-specific email
- [ ] Email delivered within 60 seconds
- [ ] Subject line includes the patient's first name
- [ ] Email body contains 3+ concern-specific instructions
- [ ] All 4 concern types produce different email content
- [ ] Warm, professional tone throughout

---

## Out of Scope (v1.0)

- Real patient data / HIPAA compliance
- Calendar integration or slot availability checks
- SMS / WhatsApp notifications
- Authentication or login
- Database persistence
