import { API_BASE } from '../config.js';

/**
 * Stream AI insights for a region via SSE.
 * Calls onChunk(text) for each delta, onDone() when complete, onError(err) on failure.
 * Returns an AbortController so the caller can cancel the stream.
 */
export function streamInsights(regionId, { onChunk, onDone, onError }) {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/insights/${regionId}`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Insights request failed: ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: ')) continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice('data: '.length).trim();
          if (!jsonStr) continue;

          try {
            const payload = JSON.parse(jsonStr);
            if (payload.text !== undefined) onChunk(payload.text);
            if (payload.done === true || 'done' in payload) onDone?.();
          } catch {
            // malformed SSE line, skip
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') onError?.(err);
    }
  })();

  return controller;
}
