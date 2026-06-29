import type { CSSProperties, ReactNode } from 'react'

// ─── Position ─────────────────────────────────────────────────────────────────

export type AeroPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

// ─── Warning Thresholds ───────────────────────────────────────────────────────

export interface AeroWarnThresholds {
  /** FPS below this triggers a warning (default: 30) */
  fps?: number
  /** GPU time (ms) above this triggers a warning (default: 20) */
  gpu?: number
  /** CPU time (ms) above this triggers a warning (default: 20) */
  cpu?: number
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface AeroPerfProps {
  /** Corner to anchor the panel. Default: 'top-left' */
  position?: AeroPosition
  /** Show real-time FPS / GPU / CPU graph. Default: true */
  showGraph?: boolean
  /** Show circular speedometer gauge. Default: true */
  showGauge?: boolean
  /** Compact mode — disables graph and gauge. Default: false */
  minimal?: boolean
  /** Show VRAM estimate bar. Default: false */
  showVRAM?: boolean
  /** How often (per second) scene stats refresh. Default: 10 */
  logsPerSecond?: number
  /** Start panel visible. false = starts as a small dot. Default: true */
  openByDefault?: boolean
  /** Expected target FPS; used to flag overclocking. Default: 60 */
  fpsLimit?: number
  /** Alert thresholds. When exceeded, values pulse red. */
  warnThresholds?: AeroWarnThresholds
  /** CSS class applied to the portal wrapper div */
  className?: string
  /** Inline style applied to the portal wrapper div */
  style?: CSSProperties
}

export interface AeroCockpitProps {
  position?: AeroPosition
  showGraph?: boolean
  showGauge?: boolean
  minimal?: boolean
  showVRAM?: boolean
}

export interface AeroCoreProps {
  logsPerSecond?: number
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface AeroState {
  fps:         number
  frameTime:   number
  gpuTime:     number
  cpuTime:     number
  drawCalls:   number
  triangles:   number
  geometries:  number
  textures:    number
  shaders:     number
  lines:       number
  points:      number
  vramBytes:   number
  history: {
    fps:        number[]
    gpu:        number[]
    cpu:        number[]
    circularId: number
  }
  paused:       boolean
  expanded:     boolean
  hidden:       boolean
  tab:          string
  gaugeMode:    'fps' | 'gpu' | 'cpu'
  fpsLimit:     number
  overclocking: boolean
  alertFps:     boolean
  alertGpu:     boolean
  alertCpu:     boolean
  fpsWarnThreshold: number
  gpuWarnThreshold: number
  cpuWarnThreshold: number
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export interface AeroActions {
  updateMetrics:   (metrics: Partial<AeroState>) => void
  pushToHistory:   (fps: number, gpu: number, cpu: number) => void
  togglePaused:    () => void
  toggleExpanded:  () => void
  toggleHidden:    () => void
  setHidden:       (hidden: boolean) => void
  setTab:          (tab: string) => void
  setFpsLimit:     (n: number) => void
  setThresholds:   (t: AeroWarnThresholds) => void
  cycleGaugeMode:  () => void
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function AeroPerf(props: AeroPerfProps): ReactNode
export function AeroCore(props: AeroCoreProps): null
export function AeroCockpit(props: AeroCockpitProps): ReactNode

export function useAero(): AeroState
export function useAero<T>(selector: (state: AeroState) => T): T

export const aeroState:   AeroState
export const aeroActions: AeroActions
export function getAero(): AeroState
