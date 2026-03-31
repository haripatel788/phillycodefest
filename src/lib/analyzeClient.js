import { mockAnalysis } from './mockAnalysis';

export async function analyzeCourtNotice(payload) {
  const explicitEndpoint = import.meta.env.VITE_ANALYZE_ENDPOINT;
  const endpoint = explicitEndpoint || '/api/analyze';

  // Vite dev does not run /api routes by default.
  if (import.meta.env.DEV && !explicitEndpoint) {
    return mockAnalysis;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    if (import.meta.env.DEV) {
      return mockAnalysis;
    }
    throw new Error('Could not reach the analyze API.');
  }

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
