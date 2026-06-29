import { useRef, useEffect } from 'react'
import { useFrame, useThree, addEffect, addAfterEffect } from '@react-three/fiber'
import { aeroActions, getAero } from './useAero'

// ─── Renderer Detection ───────────────────────────────────────────────────────

function isWebGPURenderer(gl) {
  return gl.isWebGPURenderer === true
}

// ─── Renderer Stats ───────────────────────────────────────────────────────────

function readRendererStats(gl, webgpu) {
  const info = gl.info
  if (!info?.render) return null

  const render = info.render
  const memory = info.memory || {}

  if (webgpu) {
    return {
      drawCalls:  render.drawCalls   ?? render.frameCalls ?? 0,
      triangles:  render.triangles   ?? 0,
      lines:      render.lines       ?? 0,
      points:     render.points      ?? 0,
      geometries: memory.geometries  ?? 0,
      textures:   memory.textures    ?? 0,
    }
  }

  return {
    drawCalls:  render.calls       ?? 0,
    triangles:  render.triangles   ?? 0,
    lines:      render.lines       ?? 0,
    points:     render.points      ?? 0,
    geometries: memory.geometries  ?? 0,
    textures:   memory.textures    ?? 0,
  }
}

// ─── Scene Traversal (WebGPU fallback) ───────────────────────────────────────

function countSceneStats(scene) {
  let triangles = 0, geometries = 0, drawCalls = 0, lines = 0, points = 0
  const geometrySet = new Set()
  const textureSet  = new Set()

  scene.traverse((obj) => {
    if (obj.isMesh || obj.isInstancedMesh) {
      drawCalls++
      if (obj.geometry) {
        const id = obj.geometry.uuid
        let t = 0
        if (obj.geometry.index) {
          t = obj.geometry.index.count / 3
        } else if (obj.geometry.attributes.position) {
          t = obj.geometry.attributes.position.count / 3
        }
        triangles += obj.isInstancedMesh && obj.count
          ? Math.floor(t * obj.count)
          : Math.floor(t)
        if (!geometrySet.has(id)) { geometrySet.add(id); geometries++ }
      }
    }
    if (obj.isLine)   { lines++;  drawCalls++ }
    if (obj.isPoints) { points++; drawCalls++ }
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((mat) => {
        const maps = ['map','normalMap','roughnessMap','metalnessMap',
                      'envMap','aoMap','emissiveMap','lightMap']
        maps.forEach((k) => {
          if (mat[k] && !textureSet.has(mat[k].uuid)) textureSet.add(mat[k].uuid)
        })
      })
    }
  })

  return { triangles: Math.floor(triangles), geometries, drawCalls,
           textures: textureSet.size, lines, points }
}

// ─── VRAM Estimation ─────────────────────────────────────────────────────────

function calculateVRAMUsage(scene) {
  let vramBytes = 0
  const textureSet = new Set()

  scene.traverse((obj) => {
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((mat) => {
        const maps = ['map','normalMap','roughnessMap','metalnessMap',
                      'envMap','aoMap','emissiveMap']
        maps.forEach((k) => {
          const tex = mat[k]
          if (tex && tex.image && !textureSet.has(tex.uuid)) {
            textureSet.add(tex.uuid)
            const w   = tex.image.width  || tex.image.videoWidth  || 1
            const h   = tex.image.height || tex.image.videoHeight || 1
            const mul = tex.generateMipmaps ? 1.33 : 1.0
            vramBytes += w * h * 4 * mul
          }
        })
      })
    }
    if (obj.geometry) {
      const g = obj.geometry
      if (g.index) {
        const bpe = (g.index.array && g.index.array.BYTES_PER_ELEMENT) || 2
        vramBytes += g.index.count * bpe
      }
      Object.values(g.attributes).forEach((attr) => {
        if (attr && attr.array) {
          const bpe = attr.array.BYTES_PER_ELEMENT || 4
          vramBytes += attr.count * attr.itemSize * bpe
        }
      })
    }
  })

  return vramBytes
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Headless data collector — place inside <Canvas>.
 * Collects FPS, GPU/CPU timing and scene stats every frame.
 */
export function AeroCore({ logsPerSecond = 10 }) {
  const { gl, scene } = useThree()

  const frameTimesRef     = useRef([])
  const lastTimeRef       = useRef(performance.now())
  const frameCountRef     = useRef(0)
  const updateIntervalRef = useRef(0)
  const renderStatsRef    = useRef(null)
  const isWebGPURef       = useRef(isWebGPURenderer(gl))

  // Track precise frame start for CPU timing
  const frameStartRef     = useRef(0)
  const cpuTimesRef       = useRef([])
  const gpuTimesRef       = useRef([])

  useEffect(() => {
    isWebGPURef.current = isWebGPURenderer(gl)
  }, [gl])

  // WebGL: reset info.render before each frame
  useEffect(() => {
    if (isWebGPURenderer(gl)) return undefined
    if (gl.info) gl.info.autoReset = false

    const unsub = addEffect(() => {
      frameStartRef.current = performance.now()
      if (gl.info?.reset) gl.info.reset()
    })

    return () => {
      unsub()
      if (gl.info) gl.info.autoReset = true
    }
  }, [gl])

  // Read renderer stats after frame render
  useEffect(() => {
    const unsub = addAfterEffect(() => {
      renderStatsRef.current = readRendererStats(gl, isWebGPURef.current)
    })
    return () => unsub()
  }, [gl])

  useEffect(() => {
    updateIntervalRef.current = Math.max(1, Math.floor(60 / logsPerSecond))
  }, [logsPerSecond])

  useFrame(() => {
    const aero = getAero()
    if (aero.paused) return

    const now       = performance.now()
    const delta     = now - lastTimeRef.current
    lastTimeRef.current = now
    frameCountRef.current++

    // Accumulate frame deltas
    frameTimesRef.current.push(delta)
    if (frameTimesRef.current.length > 60) frameTimesRef.current.shift()

    const avgFrame  = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
    const fps       = Math.round(1000 / avgFrame)

    // Improved timing: CPU = JS portion before GPU flush, GPU = remainder
    // When no GPU query available, use a better heuristic (35/65 split)
    const cpuTime   = frameStartRef.current > 0 ? Math.min(now - frameStartRef.current, delta * 0.65) : delta * 0.35
    const gpuTime   = Math.max(0, delta - cpuTime)

    cpuTimesRef.current.push(cpuTime)
    gpuTimesRef.current.push(gpuTime)
    if (cpuTimesRef.current.length > 30) cpuTimesRef.current.shift()
    if (gpuTimesRef.current.length > 30) gpuTimesRef.current.shift()

    const avgCpu = cpuTimesRef.current.reduce((a, b) => a + b, 0) / cpuTimesRef.current.length
    const avgGpu = gpuTimesRef.current.reduce((a, b) => a + b, 0) / gpuTimesRef.current.length

    // Push to history every frame for smooth graphs
    aeroActions.pushToHistory(fps, avgGpu, avgCpu)

    // Full stats update at reduced rate
    const interval = updateIntervalRef.current || 6
    if (frameCountRef.current % interval === 0) {
      const stats = {
        fps,
        frameTime:  Math.round(avgFrame  * 100) / 100,
        gpuTime:    Math.round(avgGpu    * 100) / 100,
        cpuTime:    Math.round(avgCpu    * 100) / 100,
        drawCalls:  0,
        triangles:  0,
        geometries: 0,
        textures:   0,
        shaders:    0,
        lines:      0,
        points:     0,
        vramBytes:  0,
      }

      const webgpu       = isWebGPURef.current
      const fromRenderer = renderStatsRef.current

      if (webgpu) {
        const src = (fromRenderer && fromRenderer.drawCalls > 0)
          ? fromRenderer
          : countSceneStats(scene)
        Object.assign(stats, src)
      } else if (fromRenderer) {
        Object.assign(stats, fromRenderer)
      }

      stats.vramBytes  = calculateVRAMUsage(scene)
      stats.overclocking = fps > aero.fpsLimit

      aeroActions.updateMetrics(stats)
    }
  })

  return null
}
