import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '../utils/errors'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Replaces a blank screen with a recoverable message when a render throws. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(`render failed${info.componentStack ? ` at${info.componentStack}` : ''}`, error)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="screen">
        <div className="empty-state" role="alert">
          <h2>Something went wrong</h2>
          <p>
            The app hit an unexpected error. Your saved progress is untouched — reloading usually
            fixes it.
          </p>
          <p className="setting-meta">{error.message}</p>
          <button type="button" className="btn btn-primary" onClick={this.handleReload}>
            Reload the app
          </button>
        </div>
      </div>
    )
  }
}
