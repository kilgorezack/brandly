import { SA_LEVEL_LABELS } from '../config.js';

const LEVELS = ['sa4', 'sa3', 'sa2'];

export default function LevelSelector({ activeLevel, onChange }) {
  return (
    <div className="level-selector">
      {LEVELS.map((level) => (
        <button
          key={level}
          className={`level-btn ${activeLevel === level ? 'active' : ''}`}
          onClick={() => onChange(level)}
        >
          {SA_LEVEL_LABELS[level]}
        </button>
      ))}
    </div>
  );
}
