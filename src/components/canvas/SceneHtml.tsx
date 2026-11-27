import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/** DOM element (the MathCanvas wrapper) that scene labels are mounted into. */
export const HtmlPortalContext = createContext<RefObject<HTMLElement | null> | null>(null)

interface SceneHtmlProps {
  position?: [number, number, number]
  /** Centre the content on the anchor point (like drei's `center`). */
  center?: boolean
  zIndex?: number
  children: ReactNode
}

/**
 * Minimal replacement for drei's <Html> (non-transform mode).
 *
 * drei's version reuses one container element across React roots; under React 19
 * StrictMode (which R3F v9 forwards into the canvas) its first root's deferred
 * unmount wipes the second root's content, so labels and speech bubbles vanished.
 * Here every mount gets a fresh element, and the old root is unmounted after the
 * current render, so it can only ever clear its own (already detached) element.
 */
export function SceneHtml({ position = [0, 0, 0], center = false, zIndex = 10, children }: SceneHtmlProps) {
  const portal = useContext(HtmlPortalContext)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const anchor = useRef<THREE.Group>(null)
  const mount = useRef<{ el: HTMLDivElement; root: Root } | null>(null)
  const projected = useMemo(() => new THREE.Vector3(), [])

  useLayoutEffect(() => {
    const target = portal?.current ?? gl.domElement.parentElement
    if (!target) return
    const el = document.createElement('div')
    el.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;will-change:transform;z-index:${zIndex};`
    target.appendChild(el)
    const root = createRoot(el)
    mount.current = { el, root }
    return () => {
      mount.current = null
      el.remove()
      window.setTimeout(() => root.unmount(), 0)
    }
  }, [portal, gl, zIndex])

  // Re-render the DOM content on every render of this component.
  useLayoutEffect(() => {
    mount.current?.root.render(
      <div style={{ transform: center ? 'translate(-50%, -50%)' : undefined }}>{children}</div>,
    )
  })

  // Follow the anchor's projected screen position.
  useFrame(() => {
    const m = mount.current
    const a = anchor.current
    if (!m || !a) return
    a.getWorldPosition(projected).project(camera)
    const hidden = projected.z > 1 || projected.z < -1
    const x = (projected.x * 0.5 + 0.5) * size.width
    const y = (-projected.y * 0.5 + 0.5) * size.height
    m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    m.el.style.display = hidden ? 'none' : ''
  })

  return <group ref={anchor} position={position} />
}
