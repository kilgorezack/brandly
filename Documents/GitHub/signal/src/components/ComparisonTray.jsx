import { useState, useEffect } from 'react';
import { fetchComparison } from '../api/comparison.js';
import {
  formatPopulation,
  formatIncome,
  formatPercent,
  formatDensity,
  formatGrowth,
  formatScore,
} from '../utils/formatters.js';
import { scoreToHex } from '../utils/scoreColors.js';
import ScoreGauge from './ScoreGauge.jsx';

export default function ComparisonTray({ ids, onRemove, onClear, onClose }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ids.length < 2) return;
    setIsLoading(true);
    fetchComparison(ids)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [ids.join(',')]);

  const regions = data?.regions || [];

  const METRICS = [
    { label: 'Population', fn: (d) => formatPopulation(d?.population) },
    { label: 'Median Income', fn: (d) => formatIncome(d?.median_household_income_aud) },
    { label: 'Families w/ Children', fn: (d) => formatPercent(d?.households_with_children_pct) },
    { label: 'Internet Access', fn: (d) => formatPercent(d?.internet_access_pct) },
    { label: 'Density', fn: (d) => formatDensity(d?.population_density_per_sqkm) },
  ];

  return (
    <div className="comparison-tray">
      <div className="comparison-tray-header">
        <span className="comparison-tray-title">
          Comparing {ids.length} Regions
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onClear}>
            Clear all
          </button>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <span className="loading-spinner" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div className="comparison-grid">
            {/* Metric labels column */}
            <div className="comparison-col" style={{ minWidth: 150, flexShrink: 0 }}>
              <div style={{ height: 80 }} /> {/* spacer for score gauge */}
              <div style={{ marginTop: 8 }}>
                {METRICS.map((m) => (
                  <div
                    key={m.label}
                    style={{
                      padding: '7px 0',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* One column per region */}
            {regions.map(({ region, demographics, score }) => (
              <div key={region.id} className="comparison-col">
                <div className="comparison-col-header">
                  <div>
                    <div className="comparison-col-name">{region.name}</div>
                    <div className="comparison-col-state">{region.type.toUpperCase()} · {region.state_code}</div>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => onRemove(region.id)}
                    title="Remove"
                    style={{ marginTop: -4 }}
                  >
                    ✕
                  </button>
                </div>

                <ScoreGauge score={score?.opportunity_score} size={64} />

                <div style={{ marginTop: 8 }}>
                  {METRICS.map((m) => (
                    <div
                      key={m.label}
                      style={{
                        padding: '7px 0',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        fontVariantNumeric: 'tabular-nums',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      {m.fn(demographics)}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Empty slot placeholders */}
            {ids.length < 5 && (
              <div
                className="comparison-col"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  minHeight: 120,
                }}
              >
                Click a region on the map to add
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
