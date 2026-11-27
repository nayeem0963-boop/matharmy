import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

interface SceneErrorBoundaryProps {
  children: ReactNode
  /** Changing this value clears a caught error (e.g. when switching modules). */
  resetKey?: unknown
}

interface SceneErrorBoundaryState {
  error: Error | null
  resetKey?: unknown
}

export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error: Error): Partial<SceneErrorBoundaryState> {
    return { error }
  }

  static getDerivedStateFromProps(
    props: SceneErrorBoundaryProps,
    state: SceneErrorBoundaryState,
  ): Partial<SceneErrorBoundaryState> | null {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey }
    }
    return null
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3D scene crashed:', error, info.componentStack)
  }

  private handleRetry = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="canvas-fallback" role="alert">
          <p>The 3D scene could not be displayed.</p>
          <p className="canvas-fallback__detail">{this.state.error.message}</p>
          <button type="button" onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface MathCanvasProps {
  children: ReactNode
  resetKey?: unknown
  cameraPosition?: [number, number, number]
}

/**
 * Shared 3D viewport: camera defaults, lighting, orbit controls and an error
 * boundary so a broken scene never takes down the rest of the UI.
 */
export function MathCanvas({
  children,
  resetKey,
  cameraPosition = [0, 4, 9],
}: MathCanvasProps) {
  return (
    <div className="math-canvas">
      <SceneErrorBoundary resetKey={resetKey}>
        <Canvas
          shadows
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
          />
          <directionalLight position={[-6, 3, -4]} intensity={0.4} />
          <Suspense fallback={null}>{children}</Suspense>
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={4}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  )
}
