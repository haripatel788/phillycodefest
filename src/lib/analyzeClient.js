import { mockAnalysis } from './mockAnalysis';

export async function analyzeCourtNotice(payload) {
  // In dev without an explicit endpoint, use mock data to avoid needing backend
  if (import.meta.env.DEV && !import.meta.env.VITE_ANALYZE_ENDPOINT) {
    return mockAnalysis;
  }

  const endpoint = import.meta.env.VITE_ANALYZE_ENDPOINT || '/api/analyze';

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network error (CORS, DNS, offline) - fall back to mock only in dev
    if (import.meta.env.DEV) {
      return mockAnalysis;
    }
    throw new Error('Could not reach the analyze API. Please check your connection and try again.');
  }

  if (!response.ok) {
    let message = 'We could not analyze this notice right now. Please try again.';
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return response.json();
}