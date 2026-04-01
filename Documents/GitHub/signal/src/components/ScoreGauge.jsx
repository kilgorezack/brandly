import { scoreToHex } from '../utils/scoreColors.js';

export default function ScoreGauge({ score, size = 80 }) {
  const radius = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const offset = circumference - (pct / 100) * circumference;
  const color = scoreToHex(pct);

  return (
    <div className="score-gauge-wrap">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-hover)"
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`,
            fill: color,
            fontSize: size * 0.26,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(pct)}
        </text>
      </svg>
      <span className="score-gauge-label">Opportunity Score</span>
    </div>
  );
}
