import { useRef, useEffect } from 'react'
import { getAero, useAero, aeroActions } from './useAero'



const GAUGE_MODES = {
  fps: {
    label: 'FPS', unit: '', minValue: 0, maxValue: 144,
    getValue:   (s) => s.fps,
    getPercent: (v, min, max) => Math.min(Math.max((v - min) / (max - min), 0), 1),
    getHealth:  (pct) => pct > 0.7 ? 'good' : pct > 0.35 ? 'warn' : 'bad',
    colorGood: '#11ff00bb', colorWarn: '#ffaa00', colorBad: '#ff3d3d',
    glowBase:  'rgba(0, 229, 255, 0.28)',
  },
  gpu: {
    label: 'GPU', unit: 'ms', minValue: 0, maxValue: 33.33,
    getValue:   (s) => s.gpuTime,
    getPercent: (v, min, max) => Math.min(Math.max((v - min) / (max - min), 0), 1),
    getHealth:  (pct) => pct < 0.4 ? 'good' : pct < 0.75 ? 'warn' : 'bad',
    colorGood: '#ff9500', colorWarn: '#ffcc00', colorBad: '#ff3d3d',
    glowBase:  'rgba(255, 149, 0, 0.28)',
  },
  cpu: {
    label: 'CPU', unit: 'ms', minValue: 0, maxValue: 33.33,
    getValue:   (s) => s.cpuTime,
    getPercent: (v, min, max) => Math.min(Math.max((v - min) / (max - min), 0), 1),
    getHealth:  (pct) => pct < 0.4 ? 'good' : pct < 0.75 ? 'warn' : 'bad',
    colorGood: '#b06cff', colorWarn: '#88beffff', colorBad: '#ff3d3d',
    glowBase:  'rgba(176, 108, 255, 0.28)',
  },
}

const lerp = (a, b, t) => a + (b - a) * t

function drawGauge(ctx, displayValue, mode, size) {
  const cfg = GAUGE_MODES[mode] || GAUGE_MODES.fps
  const cx  = size / 2
  const cy  = size / 2

  // Scale track width with gauge size
  const trackW = Math.max(6, Math.round(size * 0.075))
  const R   = size / 2 - Math.round(size * 0.10)
  const Ri  = R - Math.round(size * 0.10)

  ctx.clearRect(0, 0, size, size)

  const startAngle = 0.75 * Math.PI
  const endAngle   = 2.25 * Math.PI
  const totalAngle = endAngle - startAngle
  const pct        = cfg.getPercent(displayValue, cfg.minValue, cfg.maxValue)
  const valueAngle = startAngle + totalAngle * pct
  const health     = cfg.getHealth(pct)

  const activeColor =
    health === 'good' ? cfg.colorGood :
    health === 'warn' ? cfg.colorWarn : cfg.colorBad

  // ── Outer chrome ring ─────────────────────────────────────────────────
  const chromeGrad = ctx.createLinearGradient(0, 0, size, size)
  chromeGrad.addColorStop(0,   'rgba(180, 200, 220, 0.18)')
  chromeGrad.addColorStop(0.4, 'rgba(80, 100, 120, 0.08)')
  chromeGrad.addColorStop(1,   'rgba(180, 200, 220, 0.14)')
  ctx.beginPath()
  ctx.arc(cx, cy, R + Math.round(size * 0.07), 0, Math.PI * 2)
  ctx.strokeStyle = chromeGrad
  ctx.lineWidth   = 1.5
  ctx.stroke()

  // Outermost faint ring
  ctx.beginPath()
  ctx.arc(cx, cy, R + Math.round(size * 0.09), 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.04)'
  ctx.lineWidth   = 1
  ctx.stroke()

  // ── Background track ──────────────────────────────────────────────────
  ctx.beginPath()
  ctx.arc(cx, cy, R, startAngle, endAngle)
  ctx.strokeStyle = 'rgba(15, 24, 34, 0.98)'
  ctx.lineWidth   = trackW
  ctx.lineCap     = 'butt'
  ctx.stroke()

  // ── Outer tick ring ───────────────────────────────────────────────────
  const tickCount = 60
  for (let i = 0; i <= tickCount; i++) {
    const a     = startAngle + (totalAngle * i / tickCount)
    const major = i % 10 === 0
    const mid   = i % 5 === 0
    const tLen  = major
      ? Math.round(size * 0.075)
      : mid
        ? Math.round(size * 0.045)
        : Math.round(size * 0.022)
    const outer = R + Math.round(size * 0.055)
    const inner = outer - tLen
    const x1 = cx + Math.cos(a) * outer
    const y1 = cy + Math.sin(a) * outer
    const x2 = cx + Math.cos(a) * inner
    const y2 = cy + Math.sin(a) * inner
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = major
      ? 'rgba(140, 210, 255, 0.55)'
      : mid
        ? 'rgba(100, 180, 255, 0.25)'
        : 'rgba(60, 120, 180, 0.10)'
    ctx.lineWidth   = major ? 1.5 : 1
    ctx.lineCap     = 'butt'
    ctx.stroke()
  }

  // ── Speed zone tints ──────────────────────────────────────────────────
  const warnStart   = startAngle + totalAngle * 0.55
  const dangerStart = startAngle + totalAngle * 0.80

  ctx.beginPath()
  ctx.arc(cx, cy, R, warnStart, dangerStart)
  ctx.strokeStyle = 'rgba(255, 170, 0, 0.08)'
  ctx.lineWidth   = trackW; ctx.lineCap = 'butt'; ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, R, dangerStart, endAngle)
  ctx.strokeStyle = 'rgba(255, 61, 61, 0.12)'
  ctx.lineWidth   = trackW; ctx.lineCap = 'butt'; ctx.stroke()

  // ── Filled arc w/ gradient ────────────────────────────────────────────
  if (pct > 0.005) {
    const grad = ctx.createLinearGradient(0, size, size, 0)
    grad.addColorStop(0,    cfg.colorBad + '66')
    grad.addColorStop(0.45, cfg.colorWarn + 'aa')
    grad.addColorStop(1,    cfg.colorGood)

    ctx.beginPath()
    ctx.arc(cx, cy, R, startAngle, valueAngle)
    ctx.strokeStyle = grad
    ctx.lineWidth   = trackW
    ctx.lineCap     = 'round'
    ctx.stroke()

    // Tip glow burst
    ctx.shadowColor = activeColor
    ctx.shadowBlur  = Math.round(size * 0.12)
    ctx.beginPath()
    ctx.arc(cx, cy, R, Math.max(startAngle, valueAngle - 0.06), valueAngle)
    ctx.strokeStyle = activeColor
    ctx.lineWidth   = trackW
    ctx.lineCap     = 'round'
    ctx.stroke()
    ctx.shadowBlur  = 0
  }

  // ── Inner bezel ring ──────────────────────────────────────────────────
  const innerR    = R - Math.round(size * 0.155)
  const innerGrad = ctx.createRadialGradient(cx, cy - size * 0.1, innerR * 0.3, cx, cy, innerR)
  innerGrad.addColorStop(0, 'rgba(14, 20, 30, 0.92)')
  innerGrad.addColorStop(1, 'rgba(6, 9, 14, 0.98)')
  ctx.beginPath()
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
  ctx.fillStyle = innerGrad
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.12)'
  ctx.lineWidth   = 1
  ctx.stroke()

  // ── Secondary inner tick ring ─────────────────────────────────────────
  const innerTickR = innerR - Math.round(size * 0.032)
  for (let i = 0; i <= 12; i++) {
    const a  = startAngle + (totalAngle * i / 12)
    const x1 = cx + Math.cos(a) * innerTickR
    const y1 = cy + Math.sin(a) * innerTickR
    const x2 = cx + Math.cos(a) * (innerTickR - Math.round(size * 0.026))
    const y2 = cy + Math.sin(a) * (innerTickR - Math.round(size * 0.026))
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.18)'
    ctx.lineWidth   = 1
    ctx.stroke()
  }


  // ── Value text ────────────────────────────────────────────────────────
  const fontSize = size * 0.24
  ctx.fillStyle    = activeColor
  ctx.shadowColor  = activeColor
  ctx.shadowBlur   = 10
  ctx.font         = `700 ${fontSize}px 'Orbitron', monospace`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  const displayText = mode === 'fps'
    ? Math.round(displayValue).toString()
    : displayValue.toFixed(1)
  ctx.fillText(displayText, cx, cy - size * 0.05)
  ctx.shadowBlur = 0

  // ── Mode label ────────────────────────────────────────────────────────
  ctx.fillStyle    = 'rgba(140, 200, 240, 0.50)'
  ctx.shadowBlur   = 0
  ctx.font         = `500 ${size * 0.075}px 'Rajdhani', sans-serif`
  ctx.fillText(cfg.label + (cfg.unit ? ` (${cfg.unit})` : ''), cx, cy + size * 0.16)
}

export function AeroDial({ size = 110 }) {
  const canvasRef     = useRef(null)
  const animRef       = useRef(null)
  const currentValRef = useRef(0)
  const lastTimeRef   = useRef(0)
  const gaugeMode     = useAero((s) => s.gaugeMode)
  const cfg = GAUGE_MODES[gaugeMode] || GAUGE_MODES.fps

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width        = size * dpr
    canvas.height       = size * dpr
    canvas.style.width  = `${size}px`
    canvas.style.height = `${size}px`
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const animate = (time) => {
      const delta = time - lastTimeRef.current
      if (delta > 16) {
        lastTimeRef.current = time
        const state   = getAero()
        const mode    = state.gaugeMode || 'fps'
        const modeCfg = GAUGE_MODES[mode] || GAUGE_MODES.fps
        const target  = modeCfg.getValue(state)
        currentValRef.current = lerp(currentValRef.current, target, 0.08)
        drawGauge(ctx, currentValRef.current, mode, size)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [size])

  const handleClick = () => {
    aeroActions.cycleGaugeMode()
    currentValRef.current = 0
  }

  return (
    <canvas
      ref={canvasRef}
      className="aero-gauge"
      onClick={handleClick}
      style={{
        width: size, height: size,
        filter: `drop-shadow(0 0 12px ${cfg.glowBase})`,
      }}
      title="Click to cycle: FPS → GPU → CPU"
    />
  )
}
