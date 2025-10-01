/**
 * MinimaJS DevTools v1.0.0 - Lightweight debugging utilities
 */

// Dev tools state (minimal overhead)
let devToolsEnabled = typeof window !== 'undefined' && window.__MINIMA_DEVTOOLS__;
let componentTree = new Map();
let renderTimings = new Map();
let currentComponent = null; // Set by core framework

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
  if (!devToolsEnabled) {
    console.warn('MinimaJS DevTools not enabled. Set window.__MINIMA_DEVTOOLS__ = true to enable.');
    return;
  }

  const components = Array.from(componentTree.entries());
  if (components.length === 0) {
    console.log('No components tracked');
    return;
  }

  console.log(`MinimaJS Components (${components.length}):`);
  components.forEach(([component, info]) => {
    console.log(`  ${info.name}: ${info.renderCount} renders`);
  });
};

// Performance analyzer
const analyzePerformance = () => {
  if (!devToolsEnabled) {
    console.warn('MinimaJS DevTools not enabled. Set window.__MINIMA_DEVTOOLS__ = true to enable.');
    return;
  }

  const timings = Array.from(renderTimings.values());
  if (timings.length === 0) {
    console.log('Performance: No renders tracked');
    return;
  }

  let totalTime = 0;
  let maxTime = 0;

  for (let i = 0; i < timings.length; i++) {
    const time = timings[i].renderTime;
    totalTime += time;
    if (time > maxTime) maxTime = time;
  }

  const avgTime = totalTime / timings.length;
  console.log(`Performance: ${timings.length} renders, ${avgTime.toFixed(2)}ms avg, ${maxTime.toFixed(2)}ms max`);
};

// Enable dev tools globally
const enableDevTools = () => {
  if (typeof window !== 'undefined') {
    window.__MINIMA_DEVTOOLS__ = true;
    devToolsEnabled = true;
    console.log('MinimaJS DevTools enabled');
  }
};

// Disable dev tools globally
const disableDevTools = () => {
  if (typeof window !== 'undefined') {
    window.__MINIMA_DEVTOOLS__ = false;
    devToolsEnabled = false;
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
