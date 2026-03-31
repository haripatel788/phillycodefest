import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourtCoach } from '../context/CourtCoachContext';
import { analyzeCourtNotice } from '../lib/analyzeClient';
import { buildAnalyzePayload } from '../lib/extractors';
import { statusMessages } from '../lib/defaults';

function JusticeIcon() {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="h-24 w-24 animate-pulseScale text-primary"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M60 22V92" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M35 35H85" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M35 35L22 56H48L35 35Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M85 35L72 56H98L85 35Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M45 92H75" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <rect x="50" y="15" width="20" height="7" rx="3.5" fill="currentColor" />
    </svg>
  );
}

export default function AnalyzingPage() {
  const navigate = useNavigate();
  const { state, setAnalysis, setError, setIsLoading } = useCourtCoach();
  const [statusIndex, setStatusIndex] = useState(0);
  const hasStartedRef = useRef(false);
  const rotateMessage = useMemo(() => statusMessages[statusIndex], [statusIndex]);

  useEffect(() => {
    if (!state.upload.file && !state.upload.pastedText?.trim()) {
      navigate('/upload', { replace: true });
      return;
    }

    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    let mounted = true;
    const timer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2000);

    const run = async () => {
      setIsLoading(true);
      try {
        const minimumDelay = new Promise((resolve) => setTimeout(resolve, 2500));
        const payload = await buildAnalyzePayload(state.upload);
        const resultPromise = analyzeCourtNotice(payload);
        const [result] = await Promise.all([resultPromise, minimumDelay]);

        if (!mounted) {
          return;
        }

        if (result?.error) {
          setError(result.error);
        } else {
          setAnalysis(result);
        }
      } catch (error) {
        if (mounted) {
          setError(error.message || 'We could not analyze this notice right now.');
        }
      } finally {
        if (mounted) {
          navigate('/results', { replace: true });
        }
      }
    };

    run();

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [navigate, setAnalysis, setError, setIsLoading, state.upload]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <JusticeIcon />
      <h1 className="mt-6 font-heading text-4xl text-navy">Analyzing your notice</h1>
      <p className="mt-4 text-lg text-slate-600">{rotateMessage}</p>
      <p className="mt-8 text-sm text-slate-500">Step 2 of 3 - Please hold on</p>
    </main>
  );
}
