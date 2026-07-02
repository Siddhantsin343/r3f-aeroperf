# ✈️ r3f-aeroperf

**A lightweight, real-time performance HUD for [React Three Fiber], with full support for both WebGL and WebGPU renderers.**

Drop a single component inside your `<Canvas>` and get a fighter-jet-cockpit-style overlay showing FPS, GPU/CPU frame timing, draw calls, triangle counts, VRAM usage, and more — updated live, every frame.

---

## Features

- 🎯 **FPS / GPU time / CPU time** tracking with rolling averages
- 🕹️ **Circular speedometer gauge** (`AeroDial`) — click to cycle between FPS, GPU, and CPU views
- 📈 **Live scrolling graph** (`AeroScope`) plotting FPS/GPU/CPU history side-by-side
- 🧮 **Scene stats**: draw calls, triangles, geometries, textures, lines, points
- 💾 **VRAM estimation** based on texture and geometry buffer sizes
- ⚡ **WebGL & WebGPU renderer support**, with automatic detection and a scene-traversal fallback for WebGPU when renderer info isn't available
- 🚦 **Configurable warning thresholds** for FPS/GPU/CPU that trigger visual alerts
- 🏎️ **Overclocking flag** when FPS exceeds your target `fpsLimit`
- 🖥️ **4 dock positions** (`top-left`, `top-right`, `bottom-left`, `bottom-right`)
- 🔽 **Minimizable** to a small floating pill, **pausable**, and **expandable** to a detailed stats grid
- 🪶 **Minimal mode** for a compact, graph/gauge-free readout
- 🧠 **Global store powered by [Valtio](https://github.com/pmndrs/valtio)** — read metrics anywhere via `useAero()` or `getAero()`, independent of the panel UI
- 🎨 Ships with its own scoped CSS (`aero.css`), auto-injected on import

---

## Installation

```bash
npm install r3f-aeroperf
```

### Peer dependencies

```bash
npm install react react-dom three @react-three/fiber
```

---

## Quick Start

```jsx
import { Canvas } from '@react-three/fiber'
import { AeroPerf } from 'r3f-aeroperf'

export default function App() {
  return (
    <Canvas>
      <AeroPerf position="top-left" />

      {/* your scene */}
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </Canvas>
  )
}
```

That's it — `<AeroPerf />` must be mounted **inside** the `<Canvas>` so it has access to the Three.js renderer and scene graph. It internally portals its UI out of the WebGL canvas into an overlay `<div>`, so it renders as normal DOM/HTML on top of your 3D scene.

---

## Usage

### Full configuration

```jsx
<AeroPerf
  position="bottom-right"
  showGraph={true}
  showGauge={true}
  minimal={false}
  showVRAM={true}
  logsPerSecond={10}
  openByDefault={true}
  fpsLimit={60}
  warnThresholds={{ fps: 30, gpu: 20, cpu: 20 }}
  className="my-aero-wrapper"
  style={{ zIndex: 9999 }}
/>
```

### Minimal mode

For a compact readout with no gauge or graph:

```jsx
<AeroPerf minimal showVRAM={false} />
```

### Reading metrics elsewhere in your app

Because state lives in a shared Valtio store, you can subscribe to live metrics from **any** component — not just the built-in panel:

```jsx
import { useAero } from 'r3f-aeroperf'

function FpsBadge() {
  const fps = useAero((s) => s.fps)
  return <div>{Math.round(fps)} FPS</div>
}
```

For non-reactive reads (e.g. inside a `useFrame` render loop, where you don't want re-renders):

```jsx
import { getAero } from 'r3f-aeroperf'

useFrame(() => {
  const { fps, gpuTime } = getAero()
  // ...
})
```

### Controlling the panel programmatically

```jsx
import { aeroActions } from 'r3f-aeroperf'

aeroActions.togglePaused()      // pause/resume metric collection
aeroActions.toggleExpanded()    // show/hide the detailed stats grid
aeroActions.toggleHidden()      // minimize/restore the panel
aeroActions.setFpsLimit(120)    // change the "overclocking" reference FPS
aeroActions.setThresholds({ fps: 45 })  // update alert thresholds
aeroActions.cycleGaugeMode()    // cycle the dial between fps → gpu → cpu
```

### Using the pieces independently

Advanced users can assemble their own layout from the individual building blocks instead of `<AeroPerf />`:

```jsx
import { AeroCore, AeroCockpit } from 'r3f-aeroperf'

<Canvas>
  <AeroCore logsPerSecond={15} />
</Canvas>

// Anywhere in your regular DOM tree:
<AeroCockpit position="top-right" showGauge={false} />
```

`AeroCore` is the headless data collector (must live inside `<Canvas>`); `AeroCockpit` is the visual panel and can be rendered anywhere since it just reads from the shared store.

---

## Props Reference

### `<AeroPerf />`

| Prop             | Type                                                          | Default      | Description                                                  |
|-------------------|----------------------------------------------------------------|--------------|----------------------------------------------------------------|
| `position`        | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'top-left'` | Corner to anchor the panel                                    |
| `showGraph`       | `boolean`                                                       | `true`       | Show the real-time FPS/GPU/CPU graph                          |
| `showGauge`       | `boolean`                                                       | `true`       | Show the circular speedometer gauge                           |
| `minimal`         | `boolean`                                                       | `false`      | Compact view — disables graph and gauge                       |
| `showVRAM`        | `boolean`                                                       | `false`      | Show the estimated VRAM usage bar                              |
| `logsPerSecond`   | `number`                                                        | `10`         | How often (per second) full scene stats refresh (1–60)        |
| `openByDefault`   | `boolean`                                                       | `true`       | Start expanded; `false` starts as a minimized pill             |
| `fpsLimit`        | `number`                                                        | `60`         | Target FPS used to flag "overclocking"                        |
| `warnThresholds`  | `{ fps?: number, gpu?: number, cpu?: number }`                  | `{}`         | Values below/above which metrics are flagged as alerts         |
| `className`       | `string`                                                        | —            | CSS class applied to the portal wrapper                        |
| `style`           | `CSSProperties`                                                 | —            | Inline style applied to the portal wrapper                     |

### `<AeroCockpit />`

Accepts `position`, `showGraph`, `showGauge`, `minimal`, `showVRAM` — same meaning as above. Used internally by `AeroPerf`, or standalone if you manage `AeroCore` yourself.

### `<AeroCore />`

| Prop            | Type     | Default | Description                             |
|------------------|----------|---------|------------------------------------------|
| `logsPerSecond`  | `number` | `10`    | How often full scene stats are recomputed |

---

## Store Shape (`useAero` / `getAero`)

```ts
{
  fps, frameTime, gpuTime, cpuTime,
  drawCalls, triangles, geometries, textures, shaders, lines, points, vramBytes,
  history: { fps: number[], gpu: number[], cpu: number[], circularId: number },
  paused, expanded, hidden, tab, gaugeMode, // 'fps' | 'gpu' | 'cpu'
  fpsLimit, overclocking,
  alertFps, alertGpu, alertCpu,
  fpsWarnThreshold, gpuWarnThreshold, cpuWarnThreshold,
}
```

## Actions (`aeroActions`)

| Action                      | Description                                      |
|-------------------------------|---------------------------------------------------|
| `updateMetrics(partial)`      | Merge new metrics into state, recompute alerts    |
| `pushToHistory(fps, gpu, cpu)`| Push a sample into the circular history buffer    |
| `togglePaused()`               | Pause/resume metric collection                    |
| `toggleExpanded()`             | Show/hide the detailed stats grid                 |
| `toggleHidden()`               | Minimize/restore the whole panel                  |
| `setHidden(bool)`              | Explicitly set hidden state                       |
| `setTab(tab)`                  | Set the active tab                                |
| `setFpsLimit(n)`               | Update the FPS target used for overclock detection|
| `setThresholds({fps,gpu,cpu})` | Update alert thresholds                            |
| `cycleGaugeMode()`             | Cycle the dial: FPS → GPU → CPU                    |

---

## Components at a Glance

| Component      | Purpose                                                                 |
|------------------|----------------------------------------------------------------------------|
| `AeroPerf`       | Top-level component — mounts `AeroCore` + `AeroCockpit` via a DOM portal   |
| `AeroCore`       | Headless per-frame data collector (place inside `<Canvas>`)               |
| `AeroCockpit`    | The visual overlay panel (header, gauge, graph, side telemetry, stats)    |
| `AeroDial`       | Canvas-drawn circular gauge, click to cycle FPS/GPU/CPU                   |
| `AeroScope`      | Canvas-drawn scrolling line graph of FPS/GPU/CPU history                  |
| `AeroStats`      | Expanded grid of scene stats (triangles, draw calls, textures, etc.)      |
| `AeroVRAM`       | Estimated VRAM usage bar                                                  |
| `AeroMetrics`    | Alternate compact digital readout row (GPU/CPU/FPS/Frame)                 |
| `AeroMount`      | Utility that portals React children out of the `<Canvas>` into real DOM   |
| `useAero`        | React hook to subscribe to store state (optionally with a selector)       |
| `getAero`        | Non-reactive direct read of the store, safe for use inside `useFrame`     |
| `aeroActions`     | Imperative actions to control panel/store state                          |

---

## Screenshots

> _Add screenshots or a short GIF of the panel here to give users a preview before they install._

```md
<img width="390" height="301" alt="Screenshot 2026-07-02 222104" src="https://github.com/user-attachments/assets/3748f5aa-d06e-41e7-a09c-fb3753ad46b9" />

```

Suggested shots to capture:
1. The default top-left panel with gauge + graph visible, running against a live scene
2. The expanded state showing the "SCENE METRICS" stats grid (triangles, draw calls, textures…)
3. The minimized floating pill state
4. The VRAM bar in both normal and "critical" (>80%) states

---

## Notes

- `AeroPerf` / `AeroCore` **must** be rendered inside a react-three-fiber `<Canvas>` — they rely on `useThree()` for access to the renderer and scene.
- The panel UI itself is portaled out into regular DOM via `AeroMount`, so it isn't subject to the WebGL canvas's rendering/pointer-event constraints.
- On WebGPU renderers, if `gl.info.render` draw-call data isn't available, the library falls back to a manual scene traversal to compute draw calls, triangles, geometries, and textures.
- Metric history is stored as three fixed-length (120-sample) circular buffers, so the graph memory footprint stays constant regardless of runtime duration.

## License

MIT © Siddhant Singh
