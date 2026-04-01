import ScoreGauge from './ScoreGauge.jsx';
import InsightsDrawer from './InsightsDrawer.jsx';
import {
  formatPopulation,
  formatIncome,
  formatPercent,
  formatDensity,
  formatArea,
  formatGrowth,
  formatHouseholdSize,
  SA_TYPE_LABELS,
} from '../utils/formatters.js';
import { scoreToHex } from '../utils/scoreColors.js';

export default function RegionPanel({
  regionId,
  data,
  isLoading,
  onClose,
  onAddToComparison,
  inComparison,
}) {
  const { region, demographics, score } = data || {};

  const growthRate = demographics?.growth_rate_pct;

  return (
    <div className="panel region-panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">
            {isLoading ? (
              <span className="skeleton" style={{ display: 'block', width: 160, height: 16 }} />
            ) : (
              region?.name || '—'
            )}
          </div>
          <div className="panel-subtitle">
            {region ? SA_TYPE_LABELS[region.type] : ''}
            {region?.state_code ? ` · ${region.state_code}` : ''}
          </div>
        </div>
        <button className="btn-icon" onClick={onClose} title="Close">✕</button>
      </div>

      <div className="panel-body">
        {/* Opportunity Score */}
        <div className="region-panel-section">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <span className="loading-spinner" />
            </div>
          ) : (
            <ScoreGauge score={score?.opportunity_score} />
          )}

          {score && !isLoading && (
            <div style={{ marginTop: 12 }}>
              {[
                { label: 'Income', key: 'income_component' },
                { label: 'Families w/ Children', key: 'children_component' },
                { label: 'Population Growth', key: 'growth_component' },
                { label: 'Underserved Market', key: 'competition_component' },
                { label: 'Density', key: 'density_component' },
              ].map(({ label, key }) => (
                <ScoreBar key={key} label={label} value={score[key]} />
              ))}
            </div>
          )}
        </div>

        {/* Key metrics */}
        <div className="region-panel-section">
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>
            Demographics
          </div>
          <MetricRow label="Population" value={formatPopulation(demographics?.population)} loading={isLoading} />
          <MetricRow label="Median Household Income" value={formatIncome(demographics?.median_household_income_aud)} loading={isLoading} />
          <MetricRow label="Households with Children" value={formatPercent(demographics?.households_with_children_pct)} loading={isLoading} />
          <MetricRow label="Avg Household Size" value={formatHouseholdSize(demographics?.avg_household_size)} loading={isLoading} />
          <MetricRow label="Internet Access" value={formatPercent(demographics?.internet_access_pct)} loading={isLoading} />
          <MetricRow label="Population Density" value={formatDensity(demographics?.population_density_per_sqkm)} loading={isLoading} />
          <MetricRow label="Population Growth (16–21)" value={formatGrowth(growthRate)} loading={isLoading} />
          <MetricRow label="Area" value={formatArea(region?.area_sqkm)} loading={isLoading} />
        </div>

        {/* AI Insights */}
        <div className="region-panel-section">
          {!isLoading && <InsightsDrawer regionId={regionId} />}
        </div>
      </div>

      <div className="region-panel-actions">
        <button
          className={`btn ${inComparison ? 'btn-ghost' : 'btn-primary'}`}
          style={{ flex: 1 }}
          onClick={onAddToComparison}
          disabled={inComparison || isLoading}
        >
          {inComparison ? '✓ In Comparison' : '+ Compare'}
        </button>
      </div>
    </div>
  );
}

function MetricRow({ label, value, loading }) {
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      {loading ? (
        <span className="skeleton" style={{ display: 'block', width: 60, height: 13 }} />
      ) : (
        <span className="metric-value">{value}</span>
      )}
    </div>
  );
}

function ScoreBar({ label, value }) {
  const color = scoreToHex(value);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(value ?? 0)}
        </span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${value ?? 0}%`, background: color }}
        />
      </div>
    </div>
  );
}
