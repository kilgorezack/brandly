import { useState } from 'react';
import { useInsights } from '../hooks/useInsights.js';

export default function InsightsDrawer({ regionId }) {
  const [open, setOpen] = useState(false);
  const [activeRegionId, setActiveRegionId] = useState(null);
  const { text, isLoading, error } = useInsights(activeRegionId);

  const handleGenerate = () => {
    setActiveRegionId(regionId);
    setOpen(true);
  };

  if (!open) {
    return (
      <button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleGenerate}>
        ✦ Generate AI Insights
      </button>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          ✦ AI Analysis
        </span>
        <button className="btn-icon" onClick={() => setOpen(false)} title="Close">
          ✕
        </button>
      </div>

      {error ? (
        <p style={{ color: 'var(--score-low)', fontSize: 13 }}>
          Failed to load insights: {error}
        </p>
      ) : (
        <p className="insights-content">
          {text || (isLoading ? '' : 'No insights available.')}
          {isLoading && <span className="insights-cursor" />}
        </p>
      )}
    </div>
  );
}
