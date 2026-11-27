import { Suspense, useRef, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { SceneErrorBoundary } from './SceneErrorBoundary'
import { HtmlPortalContext } from './SceneHtml'

interface MathCanvasProps {
  children: ReactNode
  resetKey?: unknown
  cameraPosition?: [number, number, number]
  maxDistance?: number
}

/**
 * Shared 3D viewport: camera defaults, lighting, orbit controls and an error
 * boundary so a broken scene never takes down the rest of the UI.
 * R3F disposes the renderer and declarative objects when this unmounts.
 */
export function MathCanvas({
  children,
  resetKey,
  cameraPosition = [0, 4, 9],
  maxDistance = 20,
}: MathCanvasProps) {
  const htmlPortal = useRef<HTMLDivElement>(null)
  return (
    <div className="math-canvas" ref={htmlPortal}>
      <HtmlPortalContext.Provider value={htmlPortal}>
      <SceneErrorBoundary resetKey={resetKey}>
        <Canvas
          shadows="percentage"
          dpr={[1, 2]}
          camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 100 }}
        >
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.4}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0005}
            shadow-normalBias={0.03}
          />
          <directionalLight position={[-6, 3, -4]} intensity={0.4} />
          <Suspense fallback={null}>{children}</Suspense>
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={4}
            maxDistance={maxDistance}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>
      </SceneErrorBoundary>
      </HtmlPortalContext.Provider>
    </div>
  )
}

export default MathCanvas
