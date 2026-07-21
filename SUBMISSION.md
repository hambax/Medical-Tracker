# Medical Tracker Build Week Submission

Live demo: https://medical-tracker-coral.vercel.app/

Public repo: https://github.com/hambax/Medical-Tracker

## Project Summary

Medical Tracker is a family-first care logging app for serious illness. It helps families and caregivers share the load by tracking medication timing, symptoms, fatigue trends, food, mood, behaviour, notes, and appointment-ready exports in one calm timeline.

The demo uses fully synthetic brain tumour care data across three months. It does not ship with a private Google Sheet endpoint or any real patient data.

## Problem

Serious care at home often becomes a stream of small details: what medication was given, who gave it, whether fatigue is getting worse, what was eaten, what changed overnight, and what needs to be discussed with the care team.

Families often manage this across memory, texts, paper notes, and tired conversations. Medical Tracker turns those moments into a shared, structured record.

## Solution

- A clear Today view for quick logging and seeing what medication is due next.
- A standard Meds Plan so families can see what has been given and what is still coming up.
- A History view with search, filters, CSV export, and PDF review.
- A Trends view that turns Fatigue symptom logs into a simple graph and appointment prompts.
- A synthetic demo mode that shows the full value instantly without exposing real records.
- Optional Google Sheets sync so a family can own their own backend.
- `AGENTS.md` so Codex, Claude, Gemini, or another coding agent can guide a user through private setup.

## Built With Codex

Codex was used as the product-building partner: copying the original app into a safe demo repo, separating storage keys, designing the homepage, adding synthetic demo data, implementing Google Sheet row deletion, building export flows, adding the Meds Plan, creating Fatigue Trends, refining UI details, and writing agent setup instructions.

The repo is designed so another user's agent can continue the work: deploy the frontend, create the private Google Sheet backend, explain privacy tradeoffs, and help the user save the app to a phone home screen.

## Demo Flow

1. Open the homepage and introduce the product.
2. Click `Load demo data`.
3. Open `Today` and show quick logging plus `Up next on meds plan today`.
4. Open `Meds Plan` and show editable medication timing.
5. Open `Trends` and show the fatigue graph and patterns to discuss.
6. Open `History`, filter/search, preview PDF, and show the Download modal.
7. Open `Settings` and show where a private Google Apps Script sync URL is connected.
8. Open `AGENTS.md` and explain that a user's agent can set up a private deployment for their own family.

## Demo Video Script

Medical Tracker is a care logging app for families managing serious illness at home.

When my dad was living with a brain tumour, care became a lot of small but important details: medications, fatigue, food, mood, behaviour, symptoms, appointments, and handovers between people taking shifts.

This app brings those details into one shared timeline.

The demo data is completely synthetic. With one click, we can see three months of brain tumour care, from diagnosis through treatment and review.

On Today, caregivers can quickly log medication, symptoms, food, behaviour, feelings, or notes. The meds plan shows what is coming up next, and medicines already given are crossed off so the next person taking over can understand the day at a glance.

The Trends tab turns fatigue symptom logs into a simple chart. It does not diagnose anything; it helps families notice patterns they may want to discuss with the care team.

The History tab lets the family search, filter, export CSV, or prepare a PDF review before an appointment.

For real use, families own their own backend. The app can connect to a private Google Sheet through Apps Script, and this repo includes an agent setup guide so Codex or another coding agent can help deploy the app, connect Google Sheets, explain privacy practices, and add the app to an iPhone or Android home screen.

Medical Tracker is not medical advice. It is a calm, practical way to help families share the load and bring better notes into care conversations.

## Safety Notes

- Demo data is synthetic.
- No private Sheet endpoint ships with the app.
- Real users should create their own private Google Sheet and Apps Script Web App.
- The setup link containing `?sync=` should be treated as private.
- Agents should never commit real Sheet IDs, patient data, exports, or screenshots containing private records.
- The app is a logging and appointment-prep tool, not a clinical decision system.

## Suggested Submission Fields

- Project name: `Medical Tracker`
- Tagline: `A family care timeline for medications, symptoms, fatigue trends, and appointment-ready notes.`
- Built with: `Codex, HTML, CSS, JavaScript, Google Apps Script, Google Sheets, Vercel-ready static hosting`
- Repo focus: `Agent-guided private deployment for families`
- Impact: `Helps caregivers share shifts, reduce missed medication context, and bring clearer notes to appointments.`
