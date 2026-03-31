import { mockAnalysis } from './mockAnalysis';

export async function analyzeCourtNotice(payload) {
  const endpoint = import.meta.env.VITE_ANALYZE_ENDPOINT || '/api/analyze';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 404 && import.meta.env.DEV) {
    return mockAnalysis;
  }

  if (!response.ok) {
    let message = 'We could not analyze this notice right now.';
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // no-op
    }

    if (import.meta.env.DEV) {
      return mockAnalysis;
    }

    throw new Error(message);
  }

  return response.json();
}
