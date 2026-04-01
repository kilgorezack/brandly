import { useState, useCallback } from 'react';

export function useComparison() {
  const [comparisonIds, setComparisonIds] = useState([]);

  const addToComparison = useCallback((id) => {
    setComparisonIds((prev) => {
      if (prev.includes(id) || prev.length >= 5) return prev;
      return [...prev, id];
    });
  }, []);

  const removeFromComparison = useCallback((id) => {
    setComparisonIds((prev) => prev.filter((i) => i !== id));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonIds([]);
  }, []);

  return { comparisonIds, addToComparison, removeFromComparison, clearComparison };
}
