import { proxy, useSnapshot } from 'valtio'

// ─── State Store ──────────────────────────────────────────────────────────────
export const aeroState = proxy({
  // Current metrics
  fps: 0,
  frameTime: 0,
  gpuTime: 0,
  cpuTime: 0,

  // Scene stats
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  shaders: 0,
  lines: 0,
  points: 0,
  vramBytes: 0,

  // Graph history — circular buffer of 120 samples
  history: {
    fps: new Array(120).fill(0),
    gpu: new Array(120).fill(0),
    cpu: new Array(120).fill(0),
    circularId: 0,
  },

  // UI state
  paused:   false,
  expanded: false,
  hidden:   true,        // starts minimized
  tab:      'main',
  gaugeMode: 'fps',      // 'fps' | 'gpu' | 'cpu'

  // Performance thresholds
  fpsLimit:    60,
  overclocking: false,

  // Alert state (fires when below thresholds)
  alertFps:    false,  // true when fps < fpsWarnThreshold
  alertGpu:    false,  // true when gpuTime > gpuWarnThreshold
  alertCpu:    false,  // true when cpuTime > cpuWarnThreshold

  // Alert thresholds (configurable via AeroPerf props)
  fpsWarnThreshold: 30,
  gpuWarnThreshold: 20,
  cpuWarnThreshold: 20,
})

// ─── Actions ──────────────────────────────────────────────────────────────────
export const aeroActions = {
  updateMetrics(metrics) {
    Object.assign(aeroState, metrics)

    // Auto-compute alert flags
    aeroState.alertFps = aeroState.fps < aeroState.fpsWarnThreshold && aeroState.fps > 0
    aeroState.alertGpu = aeroState.gpuTime > aeroState.gpuWarnThreshold
    aeroState.alertCpu = aeroState.cpuTime > aeroState.cpuWarnThreshold
  },

  pushToHistory(fps, gpu, cpu) {
    const id = aeroState.history.circularId
    aeroState.history.fps[id] = fps
    aeroState.history.gpu[id] = gpu
    aeroState.history.cpu[id] = cpu
    aeroState.history.circularId = (id + 1) % 120
  },

  togglePaused()   { aeroState.paused   = !aeroState.paused },
  toggleExpanded() { aeroState.expanded = !aeroState.expanded },
  toggleHidden()   { aeroState.hidden   = !aeroState.hidden },
  setHidden(h)     { aeroState.hidden   = h },
  setTab(tab)      { aeroState.tab      = tab },
  setFpsLimit(n)   { aeroState.fpsLimit = n },

  setThresholds({ fps, gpu, cpu }) {
    if (fps !== undefined) aeroState.fpsWarnThreshold = fps
    if (gpu !== undefined) aeroState.gpuWarnThreshold = gpu
    if (cpu !== undefined) aeroState.cpuWarnThreshold = cpu
  },

  cycleGaugeMode() {
    const modes = ['fps', 'gpu', 'cpu']
    const idx = modes.indexOf(aeroState.gaugeMode)
    aeroState.gaugeMode = modes[(idx + 1) % modes.length]
  },
}

// ─── React Hook ───────────────────────────────────────────────────────────────
export function useAero(selector) {
  const snap = useSnapshot(aeroState)
  return selector ? selector(snap) : snap
}

// Direct read for render loops — no reactivity overhead
export function getAero() {
  return aeroState
}
