const SYSTEM_PROMPT = `You are Court Date Coach, an AI assistant that helps Philadelphia residents understand their court notices in plain, clear English. You are warm, calm, and non-judgmental. You never use legal jargon without immediately explaining it. You never give legal advice - you give legal literacy.

When given a court notice (text extracted from a PDF, image, or typed by the user), do the following:

Return a JSON object with these exact fields:

{
  "extracted": {
    "court_date": "string or null",
    "court_time": "string or null",
    "courtroom_address": "string or null",
    "judge_name": "string or null",
    "charges": ["array of charge strings"],
    "case_number": "string or null",
    "hearing_type": "arraignment | preliminary hearing | trial | sentencing | other | unknown"
  },
  "charge_explanations": [
    {
      "charge": "name of charge",
      "plain_english": "2-3 sentence plain English explanation of what this charge means",
      "max_penalty": "plain English statement of maximum penalty",
      "severity": "summary | misdemeanor | felony | unknown"
    }
  ],
  "what_will_happen": [
    "Step 1 as a plain English string",
    "Step 2 as a plain English string"
  ],
  "what_to_bring": [
    "Item 1",
    "Item 2"
  ],
  "say_this": [
    "Thing to say 1"
  ],
  "dont_say_this": [
    "Thing to avoid 1"
  ],
  "key_rights": [
    "Right 1 in plain English"
  ],
  "tone_note": "One sentence of encouragement appropriate to this situation. Calm and realistic, not falsely positive."
}

Rules:
- Write at a 6th grade reading level throughout.
- Never use the words: "pursuant," "aforementioned," "herein," "thereof," "whereby," or any legal Latin.
- If a field cannot be determined from the document, set it to null or an empty array.
- The what_will_happen array should be tailored to the specific hearing_type detected.
- Always include in key_rights: the right to a public defender, the right to remain silent, and the right to plead not guilty.
- Never tell the user what plea they should choose. Explain options neutrally.
- If this does not appear to be a court notice, return exactly: { "error": "This doesn't look like a court notice. Please upload your official court document." }
- Return ONLY the JSON object. No preamble, no explanation, no markdown code fences.`;

const DEMO_RESPONSE = {
  extracted: {
    court_date: 'Thursday, April 17, 2025',
    court_time: '9:00 AM',
    courtroom_address: 'Room 304, Criminal Justice Center, 1301 Filbert St, Philadelphia',
    judge_name: 'Not listed',
    charges: ['Retail theft (misdemeanor 2nd degree)'],
    case_number: 'MC-51-CR-0012345-2025',
    hearing_type: 'arraignment',
  },
  charge_explanations: [
    {
      charge: 'Retail theft (misdemeanor 2nd degree)',
      plain_english:
        'This means you are accused of taking items from a store without paying. A misdemeanor is a criminal charge, but it is less serious than a felony.',
      max_penalty: 'Possible penalty can include jail time and a fine, depending on your case history and the facts.',
      severity: 'misdemeanor',
    },
  ],
  what_will_happen: [
    'You will enter the courtroom and wait until your name is called.',
    'The judge will explain the charge and confirm your basic information.',
    'The court may discuss release conditions or future hearing dates.',
    'The hearing is often short, and your case may be scheduled for a later date.',
  ],
  what_to_bring: [
    'Your court notice',
    'Photo ID',
    'Lawyer contact information (if you have one)',
    'Something to take notes with',
  ],
  say_this: ['Yes, Your Honor.', 'No, Your Honor.', 'I would like to speak with my lawyer.'],
  dont_say_this: [
    'Do not explain your full story unless the judge asks.',
    'Do not argue with the judge or court staff.',
    'Do not talk to the prosecutor without your lawyer.',
  ],
  key_rights: [
    'You have the right to a lawyer, including a public defender if you cannot afford one.',
    'You have the right to remain silent.',
    'You have the right to plead not guilty.',
  ],
  tone_note: 'Take a breath, arrive early, and focus on listening closely to each instruction from the court.',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function looksLikeCourtNotice(text) {
  return /court|judge|hearing|arraignment|defendant|commonwealth|docket|criminal|case\s+number/i.test(text);
}

async function runOcrSpace({ imageBase64, imageMimeType }) {
  const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
  const formData = new URLSearchParams();
  formData.append('apikey', apiKey);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('base64Image', `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}`);

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Could not read text from image right now. Please try PDF or pasted text.');
  }

  const data = await response.json();
  const parsed = data?.ParsedResults?.[0]?.ParsedText?.trim();

  if (!parsed) {
    throw new Error('Could not detect readable text in that image. Please upload a clearer photo or paste text.');
  }

  return parsed;
}

function extractJson(raw) {
  if (!raw) throw new Error('Empty response from language model.');

  const clean = String(raw).replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    throw new Error('Response was not valid JSON.');
  }
}

function dedupeStrings(values = []) {
  return [...new Set(values.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim()))];
}

function normalizeResponse(payload) {
  if (payload?.error) {
    return { error: "This doesn't look like a court notice. Please upload your official court document." };
  }

  const extracted = payload?.extracted || {};
  const hearingTypeCandidate = extracted.hearing_type?.toLowerCase?.();
  const heardTypes = ['arraignment', 'preliminary hearing', 'trial', 'sentencing', 'other', 'unknown'];
  const safeHearingType = heardTypes.includes(hearingTypeCandidate) ? hearingTypeCandidate : 'unknown';

  const sayThis = dedupeStrings(payload?.say_this).filter((line) => !/should\s+plead/i.test(line));

  return {
    extracted: {
      court_date: extracted.court_date || null,
      court_time: extracted.court_time || null,
      courtroom_address: extracted.courtroom_address || null,
      judge_name: extracted.judge_name || null,
      charges: dedupeStrings(extracted.charges),
      case_number: extracted.case_number || null,
      hearing_type: safeHearingType,
    },
    charge_explanations: Array.isArray(payload?.charge_explanations)
      ? payload.charge_explanations
          .map((item) => ({
            charge: item?.charge || 'Unknown charge',
            plain_english: item?.plain_english || 'No explanation was returned.',
            max_penalty: item?.max_penalty || 'Penalty details were not found in this notice.',
            severity: item?.severity || 'unknown',
          }))
          .slice(0, 5)
      : [],
    what_will_happen: dedupeStrings(payload?.what_will_happen),
    what_to_bring: dedupeStrings(payload?.what_to_bring),
    say_this: sayThis,
    dont_say_this: dedupeStrings(payload?.dont_say_this),
    key_rights: dedupeStrings(payload?.key_rights),
    tone_note:
      payload?.tone_note ||
      'You are not alone in this process. Show up early, stay calm, and ask for a public defender if you need one.',
  };
}

async function callOpenRouter(documentText) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://courtdatecoach.vercel.app',
      'X-Title': 'Court Date Coach',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Here is the text from a Philadelphia court notice. Please analyze it:\n\n${documentText}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1400,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content;
}

async function callGroq(documentText) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Here is the text from a Philadelphia court notice. Please analyze it:\n\n${documentText}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1400,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content;
}

async function analyzeWithFreeModel(documentText) {
  if (process.env.OPENROUTER_API_KEY) {
    return extractJson(await callOpenRouter(documentText));
  }
  if (process.env.GROQ_API_KEY) {
    return extractJson(await callGroq(documentText));
  }
  return DEMO_RESPONSE;
}

// Vercel Edge/Serverless with "type": "module" uses Web API Request/Response
export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    let documentText = body?.documentText?.trim() || '';

    if (!documentText && body?.imageBase64) {
      documentText = await runOcrSpace({
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
      });
    }

    if (!documentText) {
      return jsonResponse({ error: 'No readable text found. Upload a file or paste text first.' }, 400);
    }

    if (!looksLikeCourtNotice(documentText)) {
      return jsonResponse({
        error: "This doesn't look like a court notice. Please upload your official court document.",
      });
    }

    const raw = await analyzeWithFreeModel(documentText);
    const normalized = normalizeResponse(raw);

    return jsonResponse(normalized);
  } catch (error) {
    console.error('[analyze] Error:', error);
    return jsonResponse(
      {
        error: 'We could not analyze this notice right now. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      500,
    );
  }
}