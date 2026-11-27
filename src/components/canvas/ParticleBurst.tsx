import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from '../../utils/reducedMotion'

interface ParticleBurstProps {
  /** Increment to fire a burst. 0 (the initial value) never fires. */
  trigger: number
  position?: [number, number, number]
  color?: string
  count?: number
  speed?: number
  /** Lifetime of a burst in seconds. */
  duration?: number
  size?: number
}

const GRAVITY = 6

/**
 * Lightweight celebratory burst: a single THREE.Points object whose
 * BufferGeometry positions are simulated on the CPU for ~1 second.
 * It is hidden (and does no work) between bursts.
 */
export function ParticleBurst({
  trigger,
  position = [0, 1, 0],
  color = '#fde047',
  count = 140,
  speed = 3.2,
  duration = 1.2,
  size = 0.12,
}: ParticleBurstProps) {
  const reduced = useReducedMotion() // no celebratory particles when the device asks for less motion
  const pointsRef = useRef<THREE.Points>(null)
  const age = useRef(Number.POSITIVE_INFINITY)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    return g
  }, [count])
  const velocities = useMemo(() => new Float32Array(count * 3), [count])
  useEffect(() => () => geometry.dispose(), [geometry])

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [size],
  )
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => {
    material.color.set(color)
  }, [material, color])

  // Fire: reset every particle to the origin with a random upward-biased velocity.
  useEffect(() => {
    if (trigger <= 0 || reduced) return
    const pos = geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const v = speed * (0.35 + 0.65 * Math.random())
      arr[i * 3] = arr[i * 3 + 1] = arr[i * 3 + 2] = 0
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * v
      velocities[i * 3 + 1] = Math.abs(Math.cos(phi)) * v + speed * 0.5
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * v
    }
    pos.needsUpdate = true
    age.current = 0
  }, [trigger, reduced, geometry, velocities, count, speed])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return
    if (age.current >= duration) {
      if (points.visible) points.visible = false
      return
    }
    points.visible = true
    const dt = Math.min(delta, 1 / 30)
    age.current += dt

    const pos = geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const drag = 1 - 1.5 * dt
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      velocities[ix + 1] -= GRAVITY * dt
      velocities[ix] *= drag
      velocities[ix + 2] *= drag
      arr[ix] += velocities[ix] * dt
      arr[ix + 1] += velocities[ix + 1] * dt
      arr[ix + 2] += velocities[ix + 2] * dt
    }
    pos.needsUpdate = true
    material.opacity = Math.max(0, 1 - age.current / duration)
  })

  return (
    <points
      ref={pointsRef}
      position={position}
      geometry={geometry}
      material={material}
      visible={false}
      frustumCulled={false}
    />
  )
}
