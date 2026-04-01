import { useState, useCallback } from 'react';
import SignalMap from './map/SignalMap.jsx';
import RegionPanel from './components/RegionPanel.jsx';
import ComparisonTray from './components/ComparisonTray.jsx';
import LevelSelector from './components/LevelSelector.jsx';
import Toast from './components/Toast.jsx';
import { useRegion } from './hooks/useRegion.js';
import { useComparison } from './hooks/useComparison.js';

export default function App() {
  const [activeLevel, setActiveLevel] = useState('sa4');
  const [toast, setToast] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const { selectedRegion, regionData, isLoading, selectRegion, clearRegion } =
    useRegion();

  const { comparisonIds, addToComparison, removeFromComparison, clearComparison } =
    useComparison();

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleAddToComparison = useCallback(() => {
    if (!selectedRegion) return;
    if (comparisonIds.includes(selectedRegion.id)) {
      showToast('Region already in comparison', 'warning');
      return;
    }
    if (comparisonIds.length >= 5) {
      showToast('Maximum 5 regions in comparison', 'warning');
      return;
    }
    addToComparison(selectedRegion.id);
    setComparisonOpen(true);
    showToast(`${selectedRegion.name} added to comparison`);
  }, [selectedRegion, comparisonIds, addToComparison, showToast]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <span className="app-logo-mark">◉</span>
          <span className="app-logo-text">Signal</span>
        </div>
        <div className="app-header-right">
          {comparisonIds.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => setComparisonOpen((v) => !v)}
            >
              Compare
              <span className="badge">{comparisonIds.length}</span>
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <SignalMap
          activeLevel={activeLevel}
          selectedRegionId={selectedRegion?.id}
          onRegionClick={selectRegion}
        />

        <LevelSelector activeLevel={activeLevel} onChange={setActiveLevel} />

        {selectedRegion && (
          <RegionPanel
            regionId={selectedRegion.id}
            data={regionData}
            isLoading={isLoading}
            onClose={clearRegion}
            onAddToComparison={handleAddToComparison}
            inComparison={comparisonIds.includes(selectedRegion.id)}
          />
        )}

        {comparisonOpen && comparisonIds.length > 0 && (
          <ComparisonTray
            ids={comparisonIds}
            onRemove={removeFromComparison}
            onClear={clearComparison}
            onClose={() => setComparisonOpen(false)}
          />
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} key={toast.id} />}
    </div>
  );
}
