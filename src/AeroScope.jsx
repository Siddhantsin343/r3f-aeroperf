import { useRef, useEffect, useCallback } from 'react'
import { getAero } from './useAero'

const COLORS = {
  fps:  '#00ffd0',   
  gpu:  '#ff9500',
  cpu:  '#b06cff',
  grid: 'rgba(20, 35, 50, 0.8)',
}

/**
 */
export function AeroScope({ width = 210, height = 56 }) {
  const canvasRef   = useRef(null)
  const animRef     = useRef(null)
  const lastDrawRef = useRef(0)

  const getOrdered = useCallback((arr, circularId) => {
    const len = arr.length
    const out = new Array(len)
    for (let i = 0; i < len; i++) {
      out[i] = arr[(circularId + i) % len]
    }
    return out
  }, [])

  const drawLine = useCallback((ctx, data, color, maxVal) => {
    if (!data || data.length === 0) return

    const pad  = 3
    const gh   = height - pad * 2
    const gw   = width  - pad * 2
    const step = gw / (data.length - 1)

    const hex = color.replace('#', '')
    const r   = parseInt(hex.substr(0, 2), 16)
    const g   = parseInt(hex.substr(2, 2), 16)
    const b   = parseInt(hex.substr(4, 2), 16)

    // Gradient fill below the line
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, `rgba(${r},${g},${b},0.15)`)
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)

    ctx.beginPath()
    ctx.fillStyle = grad

    let first = true
    for (let i = 0; i < data.length; i++) {
      const x = pad + i * step
      const y = height - pad - Math.min(data[i] / maxVal, 1) * gh
      if (first) { ctx.moveTo(x, height); ctx.lineTo(x, y); first = false }
      else        { ctx.lineTo(x, y) }
    }
    ctx.lineTo(pad + (data.length - 1) * step, height)
    ctx.closePath()
    ctx.fill()

    // Smooth line
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth   = 1.5
    ctx.lineJoin    = 'round'
    ctx.lineCap     = 'round'

    first = true
    for (let i = 0; i < data.length; i++) {
      const x = pad + i * step
      const y = height - pad - Math.min(data[i] / maxVal, 1) * gh
      if (first) { ctx.moveTo(x, y); first = false }
      else        { ctx.lineTo(x, y) }
    }
    ctx.stroke()
  }, [width, height])

  const drawGrid = useCallback((ctx) => {
    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth   = 1

    const hLines = 4
    for (let i = 1; i < hLines; i++) {
      const y = (height / hLines) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    const vLines = 8
    for (let i = 1; i < vLines; i++) {
      const x = (width / vLines) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
  }, [width, height])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const now = performance.now()
    if (now - lastDrawRef.current < 20) {       // ~50 fps
      animRef.current = requestAnimationFrame(render)
      return
    }
    lastDrawRef.current = now

    ctx.clearRect(0, 0, width, height)
    drawGrid(ctx)

    const { history } = getAero()
    const fpsData = getOrdered(history.fps, history.circularId)
    const gpuData = getOrdered(history.gpu, history.circularId)
    const cpuData = getOrdered(history.cpu, history.circularId)

    drawLine(ctx, cpuData, COLORS.cpu, 20)
    drawLine(ctx, gpuData, COLORS.gpu, 20)
    drawLine(ctx, fpsData, COLORS.fps, 144)

    animRef.current = requestAnimationFrame(render)
  }, [width, height, drawLine, drawGrid, getOrdered])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width        = width  * dpr
    canvas.height       = height * dpr
    canvas.style.width  = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)

    animRef.current = requestAnimationFrame(render)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [width, height, render])

  return (
    <canvas
      ref={canvasRef}
      className="aero-scope"
      style={{ width, height }}
    />
  )
}
