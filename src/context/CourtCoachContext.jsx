import { createContext, useContext, useMemo, useState } from 'react';

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

  const value = useMemo(
    () => ({
      state,
      setUpload: (upload) =>
        setState((prev) => ({
          ...prev,
          upload,
          error: '',
        })),
      setAnalysis: (analysis) =>
        setState((prev) => ({
          ...prev,
          analysis,
          error: '',
          isLoading: false,
        })),
      setError: (error) =>
        setState((prev) => ({
          ...prev,
          error,
          isLoading: false,
        })),
      setIsLoading: (isLoading) =>
        setState((prev) => ({
          ...prev,
          isLoading,
        })),
      startOver: () => setState(baseState),
    }),
    [state],
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
