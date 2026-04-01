import { useState, useEffect, useRef } from 'react';
import { streamInsights } from '../api/insights.js';

export function useInsights(regionId) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!regionId) return;

    setText('');
    setError(null);
    setIsLoading(true);

    controllerRef.current = streamInsights(regionId, {
      onChunk: (chunk) => setText((prev) => prev + chunk),
      onDone: () => setIsLoading(false),
      onError: (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    });

    return () => {
      controllerRef.current?.abort();
    };
  }, [regionId]);

  return { text, isLoading, error };
}
