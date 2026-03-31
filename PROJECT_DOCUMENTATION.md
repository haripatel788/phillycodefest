# Court Date Coach — Extended Architecture & File Map

This document is deliberately exhaustive. It tracks every source file and major UI screen, explains the client/server data flow, details utility helpers, lists styling/theming decisions, and records the ethical constraints built into the experience. You can point another AI or teammate at this single markdown file to understand the architecture, deployment requirements, and user journey without digging through the code.

## Repository Layout at a Glance

```
/                      # root
├─ api/
│   └─ analyze.js         # serverless handler called by the frontend
├─ public/               # static assets (unused today)
├─ src/
│   ├─ context/
│   │   └─ CourtCoachContext.jsx
│   ├─ lib/
│   │   ├─ analyzeClient.js
│   │   ├─ defaults.js
│   │   ├─ extractors.js
│   │   └─ mockAnalysis.js
│   ├─ pages/
│   │   ├─ LandingPage.jsx
│   │   ├─ UploadPage.jsx
│   │   ├─ AnalyzingPage.jsx
│   │   └─ ResultsPage.jsx
│   ├─ styles.css         # global CSS helpers
│   ├─ App.jsx            # router configuration
│   └─ main.jsx           # React entry point
├─ package.json           # dependencies & scripts
├─ tailwind.config.js     # theme tokens for Tailwind
├─ postcss.config.js      # Tailwind + autoprefixer
├─ jsconfig.json          # module resolution + casing settings
├─ index.html            # Vite entry point / font preloads
├─ .env.example          # list of env var candidates
├─ README.md             # quick start / ethical guardrail summary
└─ PROJECT_DOCUMENTATION.md (this file)
```

## 1. Build Tooling & Static Assets (Root Level Files)

### `package.json`
- Declares `react`, `react-dom`, and `react-router-dom` as the runtime stack; `pdfjs-dist` and `mammoth` handle in-browser PDF and DOCX extraction.
- Dev dependencies `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, and `autoprefixer` allow bundling, JSX transformation, and utility-first styling.
- Scripts: `npm run dev` spins the Vite dev server (localhost:5173), `npm run build` produces a production bundle, `npm run preview` runs the production bundle locally.

### `tailwind.config.js`
- Custom color tokens: `navy (#0D1B2A)`, `primary (#1B6CA8)`, `success (#2E7D52)`, `warning (#B45309)` plus `ink`, `mist`, and `border` for neutral surfaces.
- Fonts: `heading` uses Playfair Display, `body` uses IBM Plex Sans, `serif` is Source Serif 4, and `mono` is IBM Plex Mono. These replicate the `design.skill` instruction.
- Extra utilities: `boxShadow.card` for lifted cards, `keyframes`/`animation` for `floatIn` (hero reveal) and `pulseScale` (justice icon), which several components consume.

### `postcss.config.js`
- Straightforward plugin list: exports Tailwind and Autoprefixer for CSS processing.

### `index.html`
- Font preloads: Playfair Display, IBM Plex Sans, Source Serif 4, IBM Plex Mono via Google Fonts.
- Meta description about plain-English court notice analysis.
- Bootstraps Vite by loading `/src/main.jsx` after the fonts load.

### `jsconfig.json`
- Bundler-aware module resolution ensures Vite’s ESM output is recognized. `forceConsistentCasingInFileNames` guards against Windows/macOS casing issues highlighted earlier; the `include` array targets `src` and `api`.

### `.env.example` (and your working `.env` file)
- Encourages storing `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL`, `OCR_SPACE_API_KEY`, plus optional `GROQ_API_KEY` and `GROQ_MODEL`.
- The backend reads these env vars; if keys are missing the server returns `DEMO_RESPONSE` from `api/analyze.js` so the UI can still render.

### `README.md`
- Quick start instructions (`npm install`, `npm run dev`) plus notes about deploying to Vercel or Netlify.
- Explains the “ethical guardrails” embedded in the UI and API, such as no plea advice, disclaimer text, and graceful rejection of non-court documents.

### `.gitignore`
- Prevents `node_modules`, `.vite`, `.env`, `.vercel`, `netlify`, `.DS_Store`, etc. from entering version control.

## 2. React Entry Point and Routing

### `src/main.jsx`
- Imports `React` and `createRoot` rather than `ReactDOM.default`, respecting the actual exports from `react-dom/client`.
- Wraps the app in `BrowserRouter` (React Router), `CourtCoachProvider` (global state), and renders into `#root`. StrictMode is enabled.
- Adds global `styles.css` for body-level backgrounds, radial gradients, focus outlines, and print-specific classes (`no-print`).

### `src/App.jsx`
- Routes defined inside `<Routes>`:
  - `/` renders `LandingPage` (home hero + CTA).
  - `/upload` shows the upload/paste form.
  - `/analyzing` presents the loader while extraction + API run.
  - `/results` renders the structured summary.
  - `*` catches unknown paths and redirects to `/` to keep the experience linear.

## 3. Global State Context (`src/context/CourtCoachContext.jsx`)

### Purpose
- Keeps the user’s upload/paste input, the server response, loading/error states, and helper setters in one place to share across `/upload`, `/analyzing`, and `/results`.

### Structure
- `state` shape:
  ```js
  {
    upload: { file: File | null, pastedText: string },
    analysis: null | { extracted, charge_explanations, what_will_happen, ... },
    error: '',
    isLoading: false,
  }
  ```

- `baseState` resets everything; `startOver` reverts to that state (used by the Results footer to start a fresh flow).

- `useCallback` ensures `setUpload`, `setAnalysis`, `setError`, `setIsLoading`, and `startOver` are stable references, avoiding dependency loops inside `AnalyzingPage`’s effect.

- `useMemo` exposes `{ state, setUpload, ... }` so consumers can destructure only the needed pieces.

- `useCourtCoach()` is a hook that throws if used outside the provider, keeping the dependency graph clean.

## 4. Utility Libraries (`src/lib`)

### `defaults.js`
- Provides fallback arrays used when Claude’s answer is incomplete:
  - `fallbackChecklist` for “What to Bring”.
  - `fallbackSayThis`, `fallbackDontSay`, `fallbackRights` for the Say/Don’t cards and rights list.
- `legalResources` arrays contain name/description/URL/phone for Philadelphia assistance programs (PLSE, CLS, Defender Association, Bar Referral, PA Law Help).
- `statusMessages` drives the rotating loader copy on `/analyzing`.
- `hearingLabelMap` humanizes hearing-type strings from Claude (arraignment, preliminary hearing, trial, sentencing, other, unknown).

### `extractors.js`
- Imports `pdfjs-dist` and `mammoth`.
- `isSupportedFile(file)` returns `true` for PDF/TXT/DOCX/JPG/PNG/WEBP; this prevents weird uploads.
- Extraction helpers:
  - `extractTextFromPDF(file)` loads each page via `pdfjsLib.getDocument`, iterates over `pdf.numPages`, collects `page.getTextContent()`, and concatenates the `item.str` strings.
  - `extractTextFromDocx(file)` uses `mammoth.extractRawText` (which extracts in-order text and returns a `.value`).
  - `extractTextFromTxt(file)` simply calls `file.text()`.
  - `fileToBase64(file)` reads the image and returns the Base64 string (dropping the `data:` prefix) so the serverless OCR knows what to scan.
- `buildAnalyzePayload({ file, pastedText })` decides which extraction path to take:
  1. If `pastedText` exists, skip file extraction and send that plain text.
  2. Else, detect the file type: PDF, DOCX, TXT, or image. On success returns `{ documentText }` or `{ imageBase64, imageMimeType }` plus metadata.
  3. Throws a clear error if nothing was provided or the file type is unsupported.

### `mockAnalysis.js`
- Mirrors the expected Claude JSON schema so the UI can render charges, steps, checklist items, say/don’t say, rights, and tone note even when the backend is offline.
- Used implicitly whenever the frontend runs in dev mode without `VITE_ANALYZE_ENDPOINT` (the code path in `analyzeClient.js`).

### `analyzeClient.js`
- Main job: fetch the analysis JSON from the backend.
- Determines the endpoint: environment variable `VITE_ANALYZE_ENDPOINT` overrides `/api/analyze`. This allows pointing to a deployed backend even while running locally.
- In dev mode with no explicit endpoint, short-circuits to `mockAnalysis` immediately.
- Wraps `fetch` in `try/catch`; if the request fails (DNS error, server unreachable) during dev it still returns the mock data.
- Handles HTTP 404 and other non-200 responses, parsing `body.error` when present. On failure (prod) it throws an error; on dev it still uses the mock.
- Normalizes behavior so components don’t need to worry about backend connectivity.

## 5. UI Pages & Flow (src/pages)

### Shared Styling & Layout Concepts
- Card surfaces are consistently rounded (`rounded-2xl`), use subtle borders, and drop shadows (Tailwind `shadow-card`).
- Typography mix matches the spec: `font-heading` (Playfair Display) for titles, `font-serif` (Source Serif 4) for subheadings/details, `font-mono` when showing case numbers.
- Color usage: `bg-navy` hero, gradients for backgrounds, `bg-emerald-50` and `bg-amber-50` for say/don’t say cards, `border-primary` for interactive focus states, `text-slate-700`/`ink` for body text.
- Animations: `animate-floatIn` on hero, `animate-pulseScale` on the justice icon. These are defined in `tailwind.config.js` and referenced via `className`.

### `LandingPage.jsx` (Route `/`)
- Layout: full-screen hero (`min-h-screen`, `overflow-hidden`, `bg-navy`, white text). Absolute positioned blurred circles and a grain overlay for atmosphere.
- Header copy: site name “Court Date Coach” in Playfair Display (bold). Subheader tagline “Philadelphia courtroom prep, explained clearly.”
- Main headline: `Understand your court date. In plain English.` (Playfair display, upper-level weight). Subhead explains the upload promise.
- CTA button: `Link` to `/upload`, styled as rounded pill `bg-primary` button with arrow character.
- Feature grid: three cards for “What does this charge mean?”, etc. Each card uses `bg-white/10`, `border-white/20`, `backdrop-blur-sm`, and is staggered using `style={{ animationDelay }}` to create a subtle cascade.
- Footer includes the required disclaimer: “Court Date Coach is not a law firm and does not provide legal advice…”. The hero intentionally leans into trustworthy, calm language per `design.skill`.

### `UploadPage.jsx` (Route `/upload`)
- Layout: gradient background from `mist` to white, centers a rounded-3xl card with `border-border`, `shadow-card`, and ample padding.
- Top bar: left-aligned brand name, right-aligned step indicator (“Step 1 of 3 – Upload your notice”).
- Drag/drop zone: large button (so keyboard-friendly) that opens the file picker when clicked and handles drag events to add drop feedback. State `dragging` toggles the `border-primary bg-sky-50` outline.
- The text zone accepts `.pdf`, `.txt`, `.docx`, `.jpg`, `.jpeg`, `.png`, `.webp` (set on `<input accept>`). Fallback `isSupportedFile` ensures unsupported files show an error message.
- When a file is selected, the UI shows a pill with “OK” and the filename.
- Divider labeled “Or” separates file upload from text paste.
- `<textarea>` with placeholder invites pasting text; input updates local state `pastedText`.
- CTA button `Analyze My Notice →` is disabled until there’s uploaded file or paste text. Submitting saves the upload/paste state (`setUpload`) and navigates to `/analyzing`.
- Privacy note at bottom clarifies the document isn’t saved, aligning with the ethical no-PII requirement.

### `AnalyzingPage.jsx` (Route `/analyzing`)
- Visual: central `JusticeIcon` SVG (custom scaled scales of justice) with `animate-pulseScale`, accompanied by heading/subheading copy.
- `statusMessages` rotates every 2 seconds, giving the impression of progressive work. The message is memoized via `useMemo` for readability.
- `useEffect` guard ensures the hook only runs when there is content; if not, it redirects back to `/upload`.
- `hasStartedRef` prevents double invocation due to React Strict Mode’s double-mounting.
- Extraction flow:
  1. `buildAnalyzePayload(state.upload)` (file extraction or paste text). This may take a moment (especially for multi-page PDFs), which explains perceived delays.
  2. `analyzeCourtNotice(payload)` (calls backend, sees eventual JSON). The response is awaited in parallel with `minimumDelay` (2.5s) to ensure the loader doesn’t flicker too quickly.
  3. On success, `setAnalysis(result)` and `navigate('/results')`; on error, `setError(error.message)` but still navigate, so `/results` can display the message.
- Clean-up: timer for rotating status and `mounted` boolean to prevent state updates after unmount.

### `ResultsPage.jsx` (Route `/results`)
- High-level: vertical scroll with `bg-gradient-to-b from-mist via-white to-white` and `pb-32` to make room for the sticky footer.
- Header: green success banner (`bg-emerald-50`, `border-success/30`). Includes tone note (analysis?.tone_note) and error notice (if `state.error` exists).
- Section layout uses `Section` component (rounded white card with `border-border`). Each section is enumerated below with more detail:
  - **Your Case at a Glance**: `glanceRows(extracted)` builds label/value pairs (Court Date, Courtroom, Judge, Charge, Case Number, Hearing Type). Missing fields show “Not listed in your notice – check with the clerk.” Case numbers use `font-mono` for clarity.
  - **What This Charge Means**: loops over `chargeExplanations`. Each article shows the charge name, `plain_english` explanation, and `max_penalty`. If no data, a fallback message is shown. A blue highlight reiterates the rights reminder (“This does NOT mean you will be convicted…”).
  - **What Will Happen in the Courtroom**: renders an ordered list from `whatWillHappen`. If empty, a fallback paragraph explains the hearing type was unclear.
  - **What to Bring**: uses `whatToBring` (analysis or fallback). Each list item is styled as a checklist row with a fake checkbox (just visual). Items include the notice, ID, lawyer contact, proof of address, pen/paper, arrival note.
  - **What to Say (and Not Say)**: two cards side-by-side with green (say) and amber (don’t say) backgrounds, listing `sayThis` and `dontSayThis` arrays.
  - **Your Rights**: bullet list (ordered via `<li>`). Rights array ensures line items mention public defender, right to remain silent, right to plead not guilty, right to review evidence.
  - **Free Legal Help in Philadelphia**: grid of card describing PLSE, CLS, Defender Association, Bar Referral, PA Law Help with links and phone numbers.
- Persistent disclaimer section reiterates non-legal advice. A “This isn’t right” button logs event to the console for later monitoring.
- Sticky footer (`position: fixed` at bottom) contains two buttons: “Print This Summary” (`window.print()`) and “Start Over” (`startOver()` and navigate to `/upload`). Both are hidden during printing via `.no-print`.

## 6. Serverless API Handler (`api/analyze.js`)

### System Prompt
- Matches spec: instructs Claude to output a strict JSON schema (fields: `extracted`, `charge_explanations`, `what_will_happen`, etc.) with guardrails (6th grade reading level, no Latin, rights mention). This prompt is sent verbatim so you can replace the model but keep behavior.
- Demo response object `DEMO_RESPONSE` shares the same structure so the UI can look consistent when an actual LLM isn’t available.

### Input Handling
- Accepts POST requests only; rejects other HTTP verbs with `405 Method Not Allowed` so browsers get immediate feedback if a GET is attempted.
- Parses the request body (handles both stringified JSON and already parsed payloads) and extracts either:
  - `documentText`: plain text ready for language-model ingestion, or
  - `imageBase64` + `imageMimeType`: encoded image requiring OCR before analysis.
- When only `imageBase64` exists, `runOcrSpace` is invoked:
  - Builds form-encoded payload (`apikey`, `language=eng`, `isOverlayRequired=false`, `base64Image`).
  - Posts to `https://api.ocr.space/parse/image`.
  - If OCR succeeds, grabs `ParsedResults[0].ParsedText`.
  - Throws descriptive errors on OCR failure (network issue, unreadable image).
- If, after OCR, the text still lacks legal keywords (`court`, `judge`, `hearing`, `arraignment`, `defendant`, `commonwealth`, `docket`, `criminal`, `case number`), the function returns:
  ```json
  { "error": "This doesn't look like a court notice. Please upload your official court document." }
  ```
  This prevents the AI from hallucinating when the user uploads irrelevant text.

### Model Providers and API Calls
- `analyzeWithFreeModel(documentText)` orchestrates provider selection:
  1. If `OPENROUTER_API_KEY` is set, it builds a chat completion request to `https://openrouter.ai/api/v1/chat/completions`.
     - Uses `OPENROUTER_MODEL` (default `meta-llama/llama-3.3-70b-instruct:free`), `temperature=0.2`, `max_tokens=1400`.
     - Sends `SYSTEM_PROMPT` plus the `documentText`.
     - Sets headers `Authorization: Bearer ${OPENROUTER_API_KEY}`, plus `HTTP-Referer` and `X-Title`.
  2. If OpenRouter key is absent but `GROQ_API_KEY` is present, the handler calls `https://api.groq.com/openai/v1/chat/completions` with a similar payload.
     - Includes `response_format: { type: 'json_object' }` so Groq returns JSON.
  3. If neither key exists (common in early dev), immediately returns the static `DEMO_RESPONSE`.
- Errors thrown during these fetches bubble up and are caught later, resulting in a generic `500` response.

### Response Normalization
- `extractJson(raw)` and `normalizeResponse(payload)` sanitize the LLM’s output:
  - `extractJson` strips Markdown fences (```` ```json ````) in case the model accidentally wraps its answer. It then tries `JSON.parse`. If parsing fails, it heuristically finds the first `{...}` block and tries again; if that still fails it throws an error.
  - `normalizeResponse` ensures the returned fields exist:
    - `extracted`: ensures `court_date`, `court_time`, `courtroom_address`, `judge_name`, `charges`, `case_number`, `hearing_type`.
    - Always sets `hearing_type` to one of the known values or `unknown`.
    - Deduplicates string arrays and removes any `say_this` entry that mentions “should plead” (guards against giving legal advice).
    - Fills `charge_explanations` with safe defaults (charge name “Unknown charge” when missing).
    - Adds fallback `tone_note` if the model’s output is empty.
  - The final normalized object is returned to the frontend via `res.status(200).json(...)`.

### Error Paths
- Any thrown error is caught at the bottom of the handler:
  - Returns `500` with a generic message: “We could not analyze this notice right now. Please try again.”
  - When `NODE_ENV === 'development'`, the response also includes `details: error.message` for debugging.
- The frontend handles `error` fields by showing them in the Results header (the orange banner) while still staying on `/results`.

### Deploying the API
- This file is ready for Vercel or Netlify: place it under `/api/analyze.js`, and it will be deployed as a serverless function automatically.
- Ensure you set the same env vars (`OPENROUTER_API_KEY`, `GROQ_API_KEY`, `OCR_SPACE_API_KEY`, plus optional site/model overrides) in the host provider’s dashboard.
- `VITE_ANALYZE_ENDPOINT` can point to the deployed URL so local dev calls the real endpoint for staging/testing.

## 7. Detailed User Journey — Step-by-Step Flow\n+
1. **Entry (Landing)**\n+   - Visitor opens `/` and sees a dark navy hero with the brand name in Playfair Display. The hero explains that uploading a court notice will generate an explanation in plain English. The CTA `Get Started →` navigates to `/upload` while also visually signaling trust via glow/animation.\n+2. **Document Input (Upload)**\n+   - The upload card shows “Step 1 of 3”. The user can drag a file or click the dashed area to choose a PDF, DOCX, text, or image. The system validates the MIME type and shows an “OK” pill when accepted.\n+   - If the user prefers typing, the textarea accepts raw text. The `Analyze` button is disabled until either input exists to prevent empty submissions.\n+   - Clicking Analyze saves the upload into context (file object or pasted text) and navigates to `/analyzing` while showing a privacy note.\n+3. **Extraction & AI Call (Analyzing)**\n+   - The justice scales animation and rotating status message reassure the user the app is working. The effect concurrently runs `buildAnalyzePayload` and `analyzeCourtNotice`. File extraction happens in the browser; this is what causes the perceivable delay before the network request is made. The loader enforces a minimum 2.5s display to avoid flicker.\n+4. **Result Presentation (Results)**\n+   - Once the AI returns, the page shows a success banner with tone note, extracts the relevant sections, and provides multiple cards: quick glance, charge explanation, what to bring, say/don’t say, rights, resources.\n+   - The bottom disclaimer restates that Court Date Coach is not a law firm, aligning with the ethical guardrail.\n+   - A sticky footer offers “Print This Summary” and “Start Over”, with `startOver` resetting context and sending the user back to `/upload`.\n+5. **Flag Feedback**\n+   - If the extraction is wrong, clicking “This isn’t right” logs the issue to the console (a stand-in for a future review queue).\n+
## 8. Debugging & Development Tips\n+- **Mock Mode:** When `VITE_ANALYZE_ENDPOINT` is unspecified during dev, the frontend returns `mockAnalysis`. Use this to prototype UI without paying for OpenRouter.\n+- **Real API Testing:** Set `VITE_ANALYZE_ENDPOINT=https://your-vercel-url/api/analyze` and configure `OPENROUTER_API_KEY` (or Groq). Run `npm run dev` to interact with the live function.\n+- **Logging:** The Node handler doesn’t log by default, but you can sprinkle `console.log` statements (e.g., before/after `runOcrSpace`, before `fetch` calls) to inspect requests in Vercel logs.\n+- **Network Tracing:** Since extraction happens in-browser, the only network call seen in DevTools is the POST to `/analyze`. Watch that request’s timing to diagnose backend slowness. Use the Performance tab to see CPU spikes from `pdfjs-dist` extraction.\n+- **Testing Non-Court Documents:** Upload a generic doc—the API returns the friendly `error` message explained above instead of hallucinating.\n+- **Error Ribbon:** Any API error surfaces on `/results` as a yellow banner near the top, but the page still renders using fallback data so the user can proceed.\n\n## 9. Aesthetic & Design Intent (for Designers)\n- **Typography:** Playfair Display anchors trust, IBM Plex Sans keeps body text legible, Source Serif 4 adds warmth to subheads, and IBM Plex Mono highlights case numbers.\n- **Color Story:** `#0D1B2A` navy communicates seriousness, `#1B6CA8` ties to Philadelphia’s palette, success/amber colors separate green affirmations from cautionary copy.\n- **Motion:** Loader pulses the scales, hero cards use staggered `animationDelay`, and the grain overlay (via CSS background image) adds tactile depth.\n- **Spatial Composition:** The upload card floats above a gradient-from-mist background; results sections form a vertical stack with generous padding and responsive grids.\n- **Tone:** Guided by `design.skill`, the UI avoids corporate or cute language. Instead, it feels like a calm, experienced sibling—every sentence is measured, reassuring, anchored in clarity (e.g., “This does NOT mean you will be convicted.”).\n\n## 10. Future Considerations (Notes for Next Developers)\n- TODO: Replace console log flagging with real analytics/review queue (since the backend is stateless, consider storing flags in a separate logging service).\n- TODO: Add multi-language support or user accounts if expanding beyond the hackathon scope.\n- TODO: Consider caching extracted text in `sessionStorage` to support reload resilience, while keeping PII out of permanent storage.\n\n---\n\nWith this document you have the necessary story, file references, and data-flow descriptions to restore, modify, or re-implement Court Date Coach in a different environment. Load it into your next AI agent and it will know what each file does and how a user experiences the product.\n*** End Patch
