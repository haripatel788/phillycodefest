# Court Date Coach

Court Date Coach is a mobile-friendly React web app that explains Philadelphia court notices in plain English without storing personal data.

## Stack

- React + React Router + Tailwind CSS
- PDF extraction in-browser with `pdfjs-dist`
- DOCX extraction in-browser with `mammoth`
- Serverless `/api/analyze` endpoint
- Free-tier APIs:
  - OpenRouter (free model by default) or Groq (alternate)
  - OCR.space for image OCR

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and set one provider key:

- `OPENROUTER_API_KEY` (recommended), or
- `GROQ_API_KEY`

If no keys are set, the app falls back to a demo response so you can still run the hackathon flow.

## Deploy

### Vercel

- Keep frontend as-is.
- Add environment variables in Vercel project settings.
- `api/analyze.js` is automatically deployed as a serverless function.

### Netlify

- The frontend deploys as a static app.
- If you prefer Netlify Functions naming, copy `api/analyze.js` to `netlify/functions/analyze.js` and point frontend requests accordingly.

## Ethical guardrails included

- No legal-advice wording about what plea a user should choose.
- Hard disclaimer in UI.
- No data persistence or PII collection.
- Non-court-document detection returns a graceful error.
- `This isn't right` button logs extraction issues for review.
