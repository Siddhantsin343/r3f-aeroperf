import { useThree } from '@react-three/fiber'
import { forwardRef, useLayoutEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'

/**
  ✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️
 */
const AeroMount = forwardRef(function AeroMount(
  { portal, className, children, ...props },
  ref
) {
  const gl      = useThree((s) => s.gl)
  const group   = useRef(null)
  const rootRef = useRef(null)

  const target =
    portal?.current != null ? portal.current : gl.domElement.parentNode

  useLayoutEffect(() => {
    if (!group.current || !target) return

    const el   = document.createElement('div')
    const root = (rootRef.current = createRoot(el))
    target.appendChild(el)

    return () => {
      root.unmount()
      rootRef.current = null
      target.removeChild(el)
    }
  }, [target])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.render(
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    )
  })

  return <group ref={group} />
})

export { AeroMount }
