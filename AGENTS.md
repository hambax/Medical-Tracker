# Medical Tracker Agent Setup Guide

This file is for coding agents helping a user turn the open Medical Tracker demo into their own private care-tracking app.

Medical Tracker is a static frontend with optional Google Sheets sync through Google Apps Script. The demo data is synthetic. A real user's care data is private and sensitive.

## Agent Role

- Guide the user step by step; do not assume they know GitHub, Vercel, Google Sheets, or Apps Script.
- Keep the public repo generic. Do not commit a user's Sheet ID, Apps Script URL, patient details, medication list, exported logs, or screenshots containing private data.
- Treat the Apps Script Web App URL and any setup URL containing `?sync=` as private bearer links.
- Do not give medical advice. Describe the app as a logging and appointment-prep tool only.
- Prefer reversible, one-row-at-a-time data operations. Never wipe, bulk-delete, or restructure the user's Google Sheet unless the user explicitly asks and has a backup.

## Recommended Setup Path

Use this easy default path unless the user asks for different hosting:

1. Fork or clone the repo for the user.
2. Deploy the static frontend to Vercel on the free plan.
3. Create a private Google Sheet owned by the user.
4. Create a Google Apps Script project connected to that Sheet.
5. Paste the contents of `apps-script/Code.gs` into Apps Script.
6. Replace only `PASTE_GOOGLE_SHEET_ID_HERE` with the user's Sheet ID inside Apps Script, not in the public repo.
7. Deploy Apps Script as a Web App.
8. Open the deployed Medical Tracker site, paste the Apps Script Web App URL into Settings, save, and test sync.
9. Help the user copy their private setup link from Settings and open it on each trusted device.
10. Help the user add the site to their phone home screen.

## Deploy the Frontend

Default option: Vercel.

- Connect the user's GitHub repo to Vercel.
- Choose the project root as the app directory.
- Use no build command.
- Use `.` as the output/static directory if Vercel asks.
- After deployment, give the user the Vercel URL, for example `https://medical-tracker-example.vercel.app`.

Other free static hosts are fine if the user prefers them, including GitHub Pages, Netlify, or Cloudflare Pages. The app does not require a Node server for the frontend.

## Set Up Google Sheets Sync

Create a new Google Sheet owned by the user. The app will use or create these tabs:

- `DailyLog`
- `MedicationPlan`

In Apps Script:

1. Open the Google Sheet.
2. Choose Extensions -> Apps Script.
3. Paste `apps-script/Code.gs`.
4. Set `SPREADSHEET_ID` to the ID from the user's Sheet URL.
5. Confirm `appsscript.json` includes the spreadsheet scope from `apps-script/appsscript.json`.
6. Deploy -> New deployment -> Web app.
7. Execute as: the user.
8. Who has access: anyone with the link, or the least-broad option that still works for the user's devices.
9. Copy the Web App URL.

In Medical Tracker:

1. Open Settings.
2. Paste the Apps Script Web App URL.
3. Save settings.
4. Use the sync button to confirm the app can read from the Sheet.
5. Add one harmless test log, confirm it appears in `DailyLog`, then delete that one test log and confirm only that row is removed.

## Private Setup Links

Medical Tracker stores the Apps Script Web App URL in the browser's localStorage. The Settings page can copy a setup link containing the sync endpoint as a `?sync=` parameter.

Teach the user:

- The normal Vercel site URL is the public app location.
- The setup link containing `?sync=` is private and should only be opened on trusted devices.
- After opening the setup link once, the app saves the sync URL locally and removes it from the address bar.
- If a device is lost or a private setup link is shared accidentally, redeploy the Apps Script Web App or create a new deployment URL and update trusted devices.

## Phone Home Screen Install

iPhone or iPad:

1. Open the user's Medical Tracker URL in Safari.
2. If needed, open the private setup link once to connect sync.
3. Tap Share.
4. Tap Add to Home Screen.
5. Confirm the name, for example `Medical Tracker`.
6. Tap Add.

Android:

1. Open the user's Medical Tracker URL in Chrome.
2. If needed, open the private setup link once to connect sync.
3. Tap the three-dot menu.
4. Tap Add to Home screen or Install app.
5. Confirm the name, for example `Medical Tracker`.
6. Tap Add or Install.

The app uses `manifest.webmanifest` and `icon.svg`, so the home-screen shortcut should use the Medical Tracker icon when the browser supports it.

## Data Safety Practices

- Ask the user to make a backup copy of the Sheet before meaningful changes.
- Keep demo data separate from real patient data.
- Do not paste real medical records into public issues, pull requests, prompts, screenshots, or logs.
- Do not commit modified Apps Script files containing a real Sheet ID.
- Do not commit exported CSV/PDF files from a real family.
- Before testing delete behavior, create one test row and delete only that row.
- Do not call `saveMedicationPlan` against a real Sheet unless the user expects the MedicationPlan tab to be replaced by the current plan.
- Explain that Google account, Vercel account, and Apps Script permissions remain under the user's control.

## What To Verify

- The deployed frontend loads without broken assets.
- Demo data loads and stays synthetic.
- Settings can save the Apps Script Web App URL.
- A test log writes exactly one new row to `DailyLog`.
- Deleting that test log removes exactly one row.
- Meds Plan saves only when the user intentionally clicks Save meds plan.
- The Trends page reads existing Fatigue symptom logs and does not write to the Sheet.
- Export creates CSV/PDF files locally in the browser.
- The app opens from the phone home-screen shortcut.
