# AgriVision AI

A standalone demo website for **AI based smart crop disease detection and farming assistant**.

## Features

- Login page for farmers
- Plant image upload and preview
- Demo disease detection results by crop and symptom
- Browser-side ML-style image analysis using canvas pixel features
- AI image signals for leaf coverage, yellowing, spot index, and image quality
- Treatment, prevention, and care guidance
- Farm location, field size, crop stage, and weather advisory cards
- Saved scan history with field risk summary
- Downloadable crop health report and copyable advice
- Farming assistant chat for irrigation, fertilizer, pest, soil, and weather questions
- Quick assistant prompts for rain disease care, fertilizer, and pest control
- 7-day farm care checklist with saved progress
- Spray safety guidance

## Run As Full Stack Project

This project now includes a Node.js backend.

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

The backend stores app data in `data/db.json`.

## Backend Features

- Serves the frontend files
- Login API
- Scan history API
- Farm profile API
- Care plan API
- Farming assistant API
- JSON-file database storage

## Static Fallback

You can still open `index.html` directly in a browser for a front-end-only demo, but full-stack features need `npm start`.

## Install As An App

For install/offline app mode, run `npm start`, open `http://localhost:3000`, and click **Install app** when the button appears.

The app includes:

- `manifest.webmanifest` for install metadata
- `service-worker.js` for offline caching
- app icons in `assets/`

This is a front-end prototype. A real AI detector would need a trained model or backend API connected to the upload flow.
The current ML image analysis is browser-side JavaScript, while saved records and assistant requests are handled by the backend.
