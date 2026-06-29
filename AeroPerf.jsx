import { useEffect } from 'react'
import { AeroCore }    from './AeroCore'
import { AeroCockpit } from './AeroCockpit'
import { AeroMount }   from './AeroMount'
import { aeroActions }    from './useAero'

/**
 * Drop `<AeroPerf />` anywhere inside your `<Canvas>`.
 * It mounts the headless data collector and the overlay panel UI.
 *
 * @param {object}  props
 * @param {'top-left'|'top-right'|'bottom-left'|'bottom-right'} props.position
 * @param {boolean} props.showGraph      - Show real-time FPS/GPU/CPU graph
 * @param {boolean} props.showGauge      - Show circular speedometer gauge
 * @param {boolean} props.minimal        - Compact view, no graph/gauge
 * @param {boolean} props.showVRAM       - Show VRAM estimate bar
 * @param {number}  props.logsPerSecond  - Scene stat refresh rate (1–60)
 * @param {boolean} props.openByDefault  - Start panel visible (false = dot)
 * @param {number}  props.fpsLimit       - Expected FPS target (used for overclocking flag)
 * @param {object}  props.warnThresholds - { fps, gpu, cpu } alert thresholds
 * @param {string}  props.className      - Class on the portal wrapper
 * @param {object}  props.style          - Inline style on the portal wrapper
 */
export function AeroPerf({
  position       = 'top-left',
  showGraph      = true,
  showGauge      = true,
  minimal        = false,
  showVRAM       = false,
  logsPerSecond  = 10,
  openByDefault  = true,
  fpsLimit       = 60,
  warnThresholds = {},
  className,
  style,
}) {
  useEffect(() => {
    aeroActions.setHidden(!openByDefault)
  }, [openByDefault])

  useEffect(() => {
    aeroActions.setFpsLimit(fpsLimit)
  }, [fpsLimit])

  useEffect(() => {
    if (Object.keys(warnThresholds).length > 0) {
      aeroActions.setThresholds(warnThresholds)
    }
  }, [warnThresholds])

  return (
    <>
      <AeroCore logsPerSecond={logsPerSecond} />
      <AeroMount className={className} style={{ pointerEvents: 'none', ...style }}>
        <AeroCockpit
          position={position}
          showGraph={showGraph}
          showGauge={showGauge}
          minimal={minimal}
          showVRAM={showVRAM}
        />
      </AeroMount>
    </>
  )
}
