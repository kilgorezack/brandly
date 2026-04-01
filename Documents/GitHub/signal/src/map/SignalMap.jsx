import { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import { MAPBOX_TOKEN, INITIAL_VIEW, MAP_STYLE } from '../config.js';
import { SOURCE_ID, FILL_LAYER, BORDER_LAYER, HIGHLIGHT_LAYER } from './regionLayers.js';
import { FILL_PAINT, BORDER_PAINT, HIGHLIGHT_PAINT } from './choropleth.js';
import { fetchChoropleth } from '../api/choropleth.js';
import { formatScore } from '../utils/formatters.js';

export default function SignalMap({ activeLevel, selectedRegionId, onRegionClick }) {
  const mapRef = useRef(null);
  const [choroplethData, setChoroplethData] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  // Load choropleth data when active level changes
  useEffect(() => {
    let cancelled = false;
    fetchChoropleth({ type: activeLevel }).then((data) => {
      if (!cancelled) setChoroplethData(data);
    });
    return () => { cancelled = true; };
  }, [activeLevel]);

  // Hover state management
  const onMouseMove = useCallback(
    (e) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [FILL_LAYER.id],
      });

      if (features.length > 0) {
        const feature = features[0];
        const id = feature.properties?.id;

        if (id !== hoveredId) {
          if (hoveredId) {
            map.setFeatureState(
              { source: SOURCE_ID, id: hoveredId },
              { hover: false }
            );
          }
          map.setFeatureState({ source: SOURCE_ID, id }, { hover: true });
          setHoveredId(id);
        }

        setHoverInfo({
          x: e.point.x,
          y: e.point.y,
          name: feature.properties?.name,
          score: feature.properties?.opportunity_score,
        });
        map.getCanvas().style.cursor = 'pointer';
      } else {
        if (hoveredId) {
          map.setFeatureState(
            { source: SOURCE_ID, id: hoveredId },
            { hover: false }
          );
          setHoveredId(null);
        }
        setHoverInfo(null);
        map.getCanvas().style.cursor = '';
      }
    },
    [hoveredId]
  );

  const onMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (hoveredId && map) {
      map.setFeatureState({ source: SOURCE_ID, id: hoveredId }, { hover: false });
    }
    setHoveredId(null);
    setHoverInfo(null);
  }, [hoveredId]);

  const onClick = useCallback(
    (e) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [FILL_LAYER.id],
      });

      if (features.length > 0) {
        const props = features[0].properties;
        onRegionClick({ id: props.id, name: props.name, type: props.type });
      }
    },
    [onRegionClick]
  );

  // Highlight filter: show white overlay only on selected region
  const highlightFilter = selectedRegionId
    ? ['==', ['get', 'id'], selectedRegionId]
    : ['==', ['get', 'id'], ''];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        interactiveLayerIds={[FILL_LAYER.id]}
      >
        <NavigationControl position="bottom-right" />

        {choroplethData && (
          <Source
            id={SOURCE_ID}
            type="geojson"
            data={choroplethData}
            promoteId="id"
          >
            <Layer {...FILL_LAYER} paint={FILL_PAINT} />
            <Layer {...BORDER_LAYER} paint={BORDER_PAINT} />
            <Layer
              {...HIGHLIGHT_LAYER}
              paint={HIGHLIGHT_PAINT}
              filter={highlightFilter}
            />
          </Source>
        )}
      </Map>

      {hoverInfo && (
        <div
          className="map-tooltip"
          style={{ left: hoverInfo.x + 12, top: hoverInfo.y - 8 }}
        >
          <div className="map-tooltip-name">{hoverInfo.name}</div>
          <div className="map-tooltip-score">
            Score:{' '}
            <strong style={{ color: scoreColor(hoverInfo.score) }}>
              {formatScore(hoverInfo.score)}
            </strong>
            /100
          </div>
        </div>
      )}
    </div>
  );
}

function scoreColor(score) {
  if (score == null) return '#7a8fa8';
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}
