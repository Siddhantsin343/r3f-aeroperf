import { useAero } from './useAero'

/**
 * Digital readout row — GPU / CPU / Frame
 */
export function AeroMetrics({ showFps = true }) {
  const fps          = useAero((s) => s.fps)
  const gpuTime      = useAero((s) => s.gpuTime)
  const cpuTime      = useAero((s) => s.cpuTime)
  const frameTime    = useAero((s) => s.frameTime)
  const overclocking = useAero((s) => s.overclocking)
  const alertFps     = useAero((s) => s.alertFps)

  const gpuPct   = Math.min(100, (gpuTime / 33.33) * 100)
  const cpuPct   = Math.min(100, (cpuTime / 33.33) * 100)
  const fpsPct   = Math.min(100, (fps / 144)       * 100)
  const framePct = Math.min(100, (frameTime / 33.33) * 100)

  return (
    <div className="aero-header">
      {/* GPU */}
      <div className="aero-metric">
        <span className="aero-metric-value gpu">
          {gpuTime.toFixed(1)}
          <span className="aero-metric-unit">ms</span>
        </span>
        <span className="aero-metric-label">GPU</span>
        <div className="aero-metric-bar">
          <div className="aero-metric-bar-fill gpu" style={{ width: `${gpuPct}%` }} />
        </div>
      </div>

      {/* CPU */}
      <div className="aero-metric">
        <span className="aero-metric-value cpu">
          {cpuTime.toFixed(1)}
          <span className="aero-metric-unit">ms</span>
        </span>
        <span className="aero-metric-label">CPU</span>
        <div className="aero-metric-bar">
          <div className="aero-metric-bar-fill cpu" style={{ width: `${cpuPct}%` }} />
        </div>
      </div>

      {/* FPS — only shown when gauge is not visible */}
      {showFps && (
        <div className="aero-metric">
          <span
            className={`aero-metric-value fps${overclocking ? ' overclock' : ''}${alertFps ? ' warning' : ''}`}
          >
            {fps}
          </span>
          <span className="aero-metric-label">FPS{overclocking ? ' ↑' : ''}</span>
          <div className="aero-metric-bar">
            <div className="aero-metric-bar-fill fps" style={{ width: `${fpsPct}%` }} />
          </div>
        </div>
      )}

      {/* Frame time */}
      <div className="aero-metric" style={{ opacity: 0.6 }}>
        <span className="aero-metric-value" style={{ fontSize: 14, color: 'var(--aero-text-dim)' }}>
          {frameTime.toFixed(1)}
          <span className="aero-metric-unit">ms</span>
        </span>
        <span className="aero-metric-label">FRAME</span>
        <div className="aero-metric-bar">
          <div
            className="aero-metric-bar-fill fps"
            style={{ width: `${framePct}%`, opacity: 0.35 }}
          />
        </div>
      </div>
    </div>
  )
}
