import { useState, useCallback } from 'react';
import { fetchRegion } from '../api/regions.js';

export function useRegion() {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionData, setRegionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectRegion = useCallback(async (region) => {
    setSelectedRegion(region);
    setRegionData(null);
    setError(null);
    setIsLoading(true);

    try {
      const data = await fetchRegion(region.id);
      setRegionData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRegion = useCallback(() => {
    setSelectedRegion(null);
    setRegionData(null);
    setError(null);
  }, []);

  return { selectedRegion, regionData, isLoading, error, selectRegion, clearRegion };
}
