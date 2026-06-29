import { AeroScope }          from './AeroScope'
import { AeroStats, AeroVRAM } from './AeroStats'
import { AeroDial }            from './AeroDial'
import { useAero, aeroActions } from './useAero'
import { useState, useEffect }  from 'react'

// ─── Responsive dial size hook ───────────────────────────────────────────────

function useResponsiveGaugeSize() {
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') return 110
    return window.innerWidth <= 420 ? 86 : window.innerWidth <= 600 ? 96 : 110
  })

  useEffect(() => {
    const calc = () => {
      if (window.innerWidth <= 420)      setSize(86)
      else if (window.innerWidth <= 600) setSize(96)
      else                               setSize(110)
    }
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  return size
}

// ─── Side Panel — Left ────────────────────────────────────────────────────────

function LeftPanel() {
  const fps     = useAero((s) => s.fps)
  const gpuTime = useAero((s) => s.gpuTime)
  const cpuTime = useAero((s) => s.cpuTime)

  return (
    <div className="aero-side-panel aero-left-panel">
      <div className="aero-side-accent" />

      <div className="aero-side-metric">
        <div className="aero-side-value fps">{Math.round(fps)}</div>
        <div className="aero-side-label">FRAMES/SEC</div>
        <div className="aero-side-bar">
          <div className="aero-side-bar-fill fps" style={{ height: `${Math.min(100, (fps / 144) * 100)}%` }} />
        </div>
      </div>

      <div className="aero-side-divider" />

      <div className="aero-side-metric">
        <div className="aero-side-value gpu">{gpuTime.toFixed(1)}<span className="aero-side-unit">ms</span></div>
        <div className="aero-side-label">GPU RENDER</div>
        <div className="aero-side-bar">
          <div className="aero-side-bar-fill gpu" style={{ height: `${Math.min(100, (gpuTime / 33.33) * 100)}%` }} />
        </div>
      </div>

      <div className="aero-side-divider" />

      <div className="aero-side-metric">
        <div className="aero-side-value cpu">{cpuTime.toFixed(1)}<span className="aero-side-unit">ms</span></div>
        <div className="aero-side-label">CPU PROCESS</div>
        <div className="aero-side-bar">
          <div className="aero-side-bar-fill cpu" style={{ height: `${Math.min(100, (cpuTime / 33.33) * 100)}%` }} />
        </div>
      </div>
    </div>
  )
}

// ─── Side Panel — Right ───────────────────────────────────────────────────────

function RightPanel() {
  const frameTime  = useAero((s) => s.frameTime)
  const drawCalls  = useAero((s) => s.drawCalls)
  const triangles  = useAero((s) => s.triangles)

  const framePct = Math.min(100, (frameTime / 33.33) * 100)
  const isGood   = framePct < 40
  const frameColor = isGood ? '#00e5ff' : framePct < 75 ? '#ffaa00' : '#ff3d3d'

  return (
    <div className="aero-side-panel aero-right-panel">
      <div className="aero-side-accent right" />

      <div className="aero-side-metric align-right">
        <div className="aero-side-value" style={{ color: frameColor }}>
          {frameTime.toFixed(1)}<span className="aero-side-unit">ms</span>
        </div>
        <div className="aero-side-label">FRAME TIME</div>
        <div className="aero-side-bar right-bar">
          <div className="aero-side-bar-fill" style={{
            height: `${framePct}%`,
            background: `linear-gradient(0deg, ${frameColor}55, ${frameColor})`
          }} />
        </div>
      </div>

      <div className="aero-side-divider" />

      <div className="aero-side-metric align-right">
        <div className="aero-side-value" style={{ color: '#b06cff' }}>
          {drawCalls >= 1000 ? `${(drawCalls/1000).toFixed(1)}K` : drawCalls}
        </div>
        <div className="aero-side-label">DRAW CALLS</div>
        <div className="aero-side-bar right-bar">
          <div className="aero-side-bar-fill cpu" style={{ height: `${Math.min(100, (drawCalls / 500) * 100)}%` }} />
        </div>
      </div>

      <div className="aero-side-divider" />

      <div className="aero-side-metric align-right">
        <div className="aero-side-value" style={{ color: '#ff9500' }}>
          {triangles >= 1000 ? `${(triangles/1000).toFixed(1)}K` : triangles}
        </div>
        <div className="aero-side-label">TRIANGLES</div>
        <div className="aero-side-bar right-bar">
          <div className="aero-side-bar-fill gpu" style={{ height: `${Math.min(100, (triangles / 100000) * 100)}%` }} />
        </div>
      </div>
    </div>
  )
}

// ─── Graph Legend ─────────────────────────────────────────────────────────────

function GraphLegend() {
  return (
    <div className="aero-graph-legend">
      {[['fps', 'FPS'], ['gpu', 'GPU'], ['cpu', 'CPU']].map(([cls, lbl]) => (
        <span key={cls} className="aero-legend-item">
          <span className={`aero-legend-dot ${cls}`} />{lbl}
        </span>
      ))}
    </div>
  )
}

// ─── Header Buttons ───────────────────────────────────────────────────────────

function ExpandBtn({ onClick, expanded }) {
  return (
    <button className="aero-icon-btn" onClick={onClick} title={expanded ? 'Collapse' : 'Expand stats'}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 9, height: 9 }}>
        {expanded ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
      </svg>
    </button>
  )
}

function HideBtn({ onClick }) {
  return (
    <button className="aero-icon-btn" onClick={onClick} title="Minimize panel">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 9, height: 9 }}>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    </button>
  )
}

function PauseBtn({ paused, onClick }) {
  return (
    <button className="aero-icon-btn" onClick={onClick} title={paused ? 'Resume' : 'Pause'}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 9, height: 9 }}>
        {paused
          ? <polygon points="5 3 19 12 5 21 5 3" />
          : <><line x1="6" y1="4" x2="6" y2="20" /><line x1="18" y1="4" x2="18" y2="20" /></>}
      </svg>
    </button>
  )
}

// ───  Pill ───────────────────────────────────────────────────────────

function MinimizedPill({ position, fps, onClick }) {
  return (
    <button className={`aero-panel-pill ${position}`} onClick={onClick}
      title="Restore AeroPerf" aria-label="Show performance panel"
      style={{ pointerEvents: 'auto' }}>
      <span className="aero-pill-val">{Math.round(fps)}</span>
      <span className="aero-pill-lbl">FPS</span>
    </button>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function AeroCockpit({
  position  = 'top-left',
  showGraph = true,
  showGauge = true,
  minimal   = false,
  showVRAM  = false,
}) {
  const expanded    = useAero((s) => s.expanded)
  const hidden      = useAero((s) => s.hidden)
  const paused      = useAero((s) => s.paused)
  const fps         = useAero((s) => s.fps)
  const gaugeSize   = useResponsiveGaugeSize()
  // graph height scales with gauge
  const graphH      = Math.round(gaugeSize * 0.36)

  if (hidden) {
    return <MinimizedPill position={position} fps={fps} onClick={() => aeroActions.toggleHidden()} />
  }

  return (
    <div className={`aero-panel ${position}${minimal ? ' minimal' : ''}`} style={{ pointerEvents: 'auto' }}>

      {/* ── Top header ──────────────────────────────────────────────── */}
      <div className="aero-panel-header">
        <div className="aero-brand">
          {/* <div className="aero-brand-orb" />*/}

     <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    style={{ animation: 'aero-orb-spin 8s linear infinite', flexShrink: 0 }}
  >
    {/* Main body */}
    <path
      d="M21 3L3 10.5L10 13L13 21L21 3Z"
      fill="#00cfff"
      stroke="#4433cc"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Left wing */}
    <path
      d="M10 13L3 10.5L7 15Z"
      fill="#8877cc"
      stroke="#4433cc"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Tail wing */}
    <path
      d="M13 21L10 13L15 17Z"
      fill="#ff6699"
      stroke="#4433cc"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>

          <span className="aero-callsign">AEROPERF</span>
        </div>
        <div className="aero-panel-header-btns">
          <ExpandBtn onClick={() => aeroActions.toggleExpanded()} expanded={expanded} />
          <HideBtn   onClick={() => aeroActions.toggleHidden()} />
          <PauseBtn  paused={paused} onClick={() => aeroActions.togglePaused()} />
        </div>
      </div>

      {/* ── 3-column cockpit layout ─────────────────────────────────── */}
      <div className="aero-cockpit">

        {/* Left telemetry column */}
        <LeftPanel />

        {/* Center — gauge + graph */}
        <div className="aero-center-col">
          {showGauge && !minimal && (
            <div className="aero-gauge-col">
              <AeroDial size={gaugeSize} />
            </div>
          )}

          {showGraph && !minimal && (
            <>
              <div className="aero-graph-container">
                <AeroScope width={220} height={graphH} />
              </div>
              <GraphLegend />
            </>
          )}
        </div>

        {/* Right telemetry column */}
        <RightPanel />
      </div>

      {/* ── Expanded stats grid ─────────────────────────────────────── */}
      {!minimal && expanded && (
        <div className="aero-stats-section">
          <div className="aero-stats-divider">
            <span className="aero-stats-divider-label">SCENE METRICS</span>
          </div>
          <AeroStats />
        </div>
      )}

      {showVRAM && !minimal && <AeroVRAM />}
    </div>
  )
}
