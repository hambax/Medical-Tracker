# Medical Tracker

Medical Tracker is a family-first care logging app for serious illness. It helps caregivers record medication, symptoms, feelings, behaviour, food, notes, and medication plans in one shared timeline.

This repo is prepared as an open demo product. The first screen explains the product, the workflow, and the family story behind it; the tracker remains a static web app that can run locally or on a free hosting service such as Vercel.

## Data Safety

This demo does **not** include a default private Google Sheets endpoint. Sync is off until someone explicitly adds an Apps Script Web App URL in Settings.

The browser storage keys are also separate from the original care-log app, so this duplicate will not read or overwrite the original app's local cached data.

## Local Preview

Run a static server from this folder:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Core Features

- Product homepage and family story
- One patient profile
- Quick medication logging
- Quick feeling, symptom, behaviour, food, and care-note logging
- Standard medication plan
- Today timeline
- Searchable history
- CSV and PDF exports
- Optional Google Sheets sync through Apps Script
- Agent-guided setup instructions for private deployments

## Build Week Submission

For the public demo story, start with:

```text
SUBMISSION.md
```

It includes the product summary, Codex angle, demo flow, and a short video script.

## Google Sheets Backend

The optional Apps Script backend is in:

```text
apps-script/Code.gs
```

It creates/uses these tabs:

- `DailyLog`
- `MedicationPlan`

Deploy it as a Google Apps Script Web App, then paste the Web App URL into Settings.

## Agent Setup Guide

If you are using Codex, Claude, Gemini, or another coding agent to set this up for a real family, start with:

```text
AGENTS.md
```

That guide explains the recommended Vercel frontend deployment, private Google Sheet backend setup, secure data-handling practices, and how to help the user save Medical Tracker to an iPhone or Android home screen.
