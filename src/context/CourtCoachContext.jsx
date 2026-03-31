import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CourtCoachContext = createContext(null);

const baseState = {
  upload: {
    file: null,
    pastedText: '',
  },
  analysis: null,
  error: '',
  isLoading: false,
};

export function CourtCoachProvider({ children }) {
  const [state, setState] = useState(baseState);

  const setUpload = useCallback(
    (upload) =>
      setState((prev) => ({
        ...prev,
        upload,
        error: '',
      })),
    [],
  );

  const setAnalysis = useCallback(
    (analysis) =>
      setState((prev) => ({
        ...prev,
        analysis,
        error: '',
        isLoading: false,
      })),
    [],
  );

  const setError = useCallback(
    (error) =>
      setState((prev) => ({
        ...prev,
        error,
        isLoading: false,
      })),
    [],
  );

  const setIsLoading = useCallback(
    (isLoading) =>
      setState((prev) => ({
        ...prev,
        isLoading,
      })),
    [],
  );

  const startOver = useCallback(() => setState(baseState), []);

  const value = useMemo(
    () => ({
      state,
      setUpload,
      setAnalysis,
      setError,
      setIsLoading,
      startOver,
    }),
    [setAnalysis, setError, setIsLoading, setUpload, startOver, state],
  );

  return <CourtCoachContext.Provider value={value}>{children}</CourtCoachContext.Provider>;
}

export function useCourtCoach() {
  const context = useContext(CourtCoachContext);
  if (!context) {
    throw new Error('useCourtCoach must be used inside CourtCoachProvider');
  }
  return context;
}
