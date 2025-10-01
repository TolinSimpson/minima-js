/**
 * MinimaJS DevTools v1.0.0 - Lightweight debugging utilities
 */

// Cached constants
const HAS_WINDOW = typeof window !== 'undefined';
const WARN_DISABLED = 'MinimaJS DevTools not enabled. Set window.__MINIMA_DEVTOOLS__ = true to enable.';

// Dev tools state (minimal overhead)
let devToolsEnabled = HAS_WINDOW && window.__MINIMA_DEVTOOLS__;
let componentTree = new Map();
let renderTimings = new Map();
let currentComponent = null;

// Dev tools hook for component inspection
const useDevTools = (componentName) => {
  if (!devToolsEnabled || !currentComponent) return {};

  const compKey = currentComponent;
  const existing = componentTree.get(compKey);

  // Update render count
  componentTree.set(compKey, {
    name: componentName || existing?.name || 'Anonymous',
    renderCount: (existing?.renderCount || 0) + 1,
    timestamp: Date.now()
  });

  return {
    inspect: () => componentTree.get(compKey),
    logState: () => console.log('Component:', componentTree.get(compKey))
  };
};

// Performance profiling hook
const useProfiler = (componentName) => {
  if (!devToolsEnabled) return {};

  const startTime = performance.now();

  // This would need to be integrated with core's useEffect
  // For now, provide a manual profiling API
  return {
    getTimings: () => renderTimings.get(currentComponent),
    measure: (label) => {
      console.time(label);
      return () => console.timeEnd(label);
    },
    mark: (label) => performance.mark(label)
  };
};

// Component tree inspector
const inspectComponentTree = () => {
  if (!devToolsEnabled) return console.warn(WARN_DISABLED);
  const components = Array.from(componentTree.entries());
  if (!components.length) return console.log('No components tracked');
  console.log(`MinimaJS Components (${components.length}):`);
  components.forEach(([, info]) => console.log(`  ${info.name}: ${info.renderCount} renders`));
};

// Performance analyzer
const analyzePerformance = () => {
  if (!devToolsEnabled) return console.warn(WARN_DISABLED);
  const timings = Array.from(renderTimings.values());
  if (!timings.length) return console.log('Performance: No renders tracked');

  const totalTime = timings.reduce((sum, t) => sum + t.renderTime, 0);
  const maxTime = Math.max(...timings.map(t => t.renderTime));

  console.log(`Performance: ${timings.length} renders, ${(totalTime / timings.length).toFixed(2)}ms avg, ${maxTime.toFixed(2)}ms max`);
};

// Enable/disable dev tools globally
const enableDevTools = () => {
  if (HAS_WINDOW) {
    window.__MINIMA_DEVTOOLS__ = devToolsEnabled = true;
    console.log('MinimaJS DevTools enabled');
  }
};

const disableDevTools = () => {
  if (HAS_WINDOW) {
    window.__MINIMA_DEVTOOLS__ = devToolsEnabled = false;
    console.log('MinimaJS DevTools disabled');
  }
};

// Export dev tools API
export {
  useDevTools,
  useProfiler,
  inspectComponentTree,
  analyzePerformance,
  enableDevTools,
  disableDevTools
};
