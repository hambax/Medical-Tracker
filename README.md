# Medical Tracker

Medical Tracker is a family-first care logging app for serious illness. It helps caregivers record medication, symptoms, feelings, behaviour, food, notes, and medication plans in one shared timeline.

This repo is prepared as an open demo product. The first screen explains the product, the workflow, and the family story behind it; the tracker remains a static web app that can run locally or on a free hosting service such as Vercel.

Live demo: https://medical-tracker-coral.vercel.app/

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

Medical tracker was built with ChatGPT 5.5 and 5.6 Sol As the planning and thought partners, mostly using the voice dictation features while out on a walk with the dog. Then using the codex remote feature, the decisions that were made and plans that were proposed while out were sent back to Codex, which was then the main coding build partner that implemented the new features into the product. 

Codex was used throughout to build the architecture and also to implement the script that connected the Google Sheets back-end. 
Codex maintained this project across 2 months of intense care and maintained flawless Uptime and data quality and reliability of the product.
The whole project has been refactored in the past week during this OpenAI Build Week competition time using Codex and GPT-5.6 Sol in order to make it ready for submission and open sourcing.
Some new features have been added, the UI has been modified and tidied up, but fundamentally the functionality remains the same as the core idea of having a medical tracking tool that is available as a web app that is React based, that connects to a Google Sheet backend, and is very easy to use for family members and nurses and doctors who may not be technical. 

This app has been requested to be publicly released by everyone that has used it so far, And it is the intention that it goes on to help many other families and caregivers.

It is provided with a github.com repo that includes instructions for the agent that will help anyone who has access to ChatGPT or other agents to To pick up and configure the tool for their needs, including their own personal Google Sheet back end and it is intended that the app is entirely free to use. 

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
