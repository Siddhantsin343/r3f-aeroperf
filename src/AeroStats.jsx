import { useAero } from './useAero'

function formatNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Luxury circular stat bubbles — matches the wireframe circles layout.
 */
export function AeroStats() {
  const drawCalls  = useAero((s) => s.drawCalls)
  const triangles  = useAero((s) => s.triangles)
  const geometries = useAero((s) => s.geometries)
  const textures   = useAero((s) => s.textures)
  const lines      = useAero((s) => s.lines)
  const points     = useAero((s) => s.points)

  const stats = [
    { label: 'TRIANGLES',  value: formatNum(triangles),  color: '#00ff37ff' },
    { label: 'DRAW CALLS', value: formatNum(drawCalls),  color: '#006effff' },
    { label: 'TEXTURES',   value: formatNum(textures),   color: '#ff00ffff' },
    { label: 'GEOMETRIES', value: formatNum(geometries), color: '#fff700ff' },
    { label: 'LINES',      value: formatNum(lines),      color: '#cc00ffff' },
    { label: 'POINTS',     value: formatNum(points),     color: '#00e5ff' },
  ]

  return (
    <div className="aero-stats">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="aero-stat-bubble">
          <div className="aero-stat-ring" style={{ '--stat-color': color }}>
            <span className="aero-stat-value" style={{ color }}>{value}</span>
          </div>
          <span className="aero-stat-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

export function AeroVRAM() {
  const vramBytes = useAero((s) => s.vramBytes)
  const maxVRAM   = 2 * 1024 * 1024 * 1024
  const pct       = Math.min(100, (vramBytes / maxVRAM) * 100)
  const critical  = pct > 80

  return (
    <div className="aero-vram">
      <div className="aero-vram-header">
        <span className="aero-vram-label">VRAM</span>
        <span className="aero-vram-value" style={critical ? { color: 'var(--aero-danger)' } : undefined}>
          {formatBytes(vramBytes)}
        </span>
      </div>
      <div className="aero-vram-bar">
        <div className="aero-vram-fill" style={{
          width: `${pct}%`,
          background: critical ? 'linear-gradient(90deg, #ff8c00, #ff2d2d)' : undefined,
          boxShadow: critical ? '0 0 8px rgba(255, 45, 45, 0.5)' : undefined,
        }} />
      </div>
    </div>
  )
}
