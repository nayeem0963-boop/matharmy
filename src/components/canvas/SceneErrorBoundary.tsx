import { Component, type ErrorInfo, type ReactNode } from 'react'

interface SceneErrorBoundaryProps {
  children: ReactNode
  /** Changing this value clears a caught error (e.g. when switching modules). */
  resetKey?: unknown
}

interface SceneErrorBoundaryState {
  error: Error | null
  resetKey?: unknown
}

/**
 * Catches errors from the 3D scene, including failures to load a lazy scene
 * chunk, so the rest of the UI keeps working.
 */
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
