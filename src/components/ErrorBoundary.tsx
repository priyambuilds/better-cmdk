import React, { Component, ReactNode } from 'react'

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  isolationLevel?: 'component' | 'feature' | 'global'
  recoveryStrategy?: 'retry' | 'fallback' | 'reload'
  maxRetries?: number
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  resetCount: number
}

/**
 * Simplified error boundary for command palette
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetErrorBoundary = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: prevState.resetCount + 1,
    }))
  }

  render(): ReactNode {
    const { hasError, error, resetCount } = this.state
    const {
      children,
      fallback,
      isolationLevel = 'component',
      maxRetries = 2,
    } = this.props

    if (!hasError) {
      return children
    }

    // Custom fallback
    if (fallback && error) {
      return fallback(error, this.resetErrorBoundary)
    }

    // Too many retries - show fatal error
    if (resetCount >= maxRetries) {
      if (isolationLevel === 'global') {
        return (
          <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
            <div className="mb-4 text-6xl">💥</div>
            <h3 className="mb-2 text-xl font-semibold">Application Error</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              The application has crashed. Please reload the extension.
            </p>
            <button
              onClick={() => chrome.runtime.reload()}
              className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
            >
              Reload Extension
            </button>
          </div>
        )
      } else {
        return (
          <div className="p-4 text-center text-gray-600 dark:text-gray-400">
            <div className="mb-2 text-2xl">⚠️</div>
            <p>Service temporarily unavailable</p>
          </div>
        )
      }
    }

    // Default error UI
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
        <div className="mb-3 text-5xl">
          {isolationLevel === 'global' ? '💥' : '⚠️'}
        </div>
        <h3 className="mb-2 text-lg font-semibold">
          {isolationLevel === 'global'
            ? 'Application Error'
            : 'Component Error'}
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={this.resetErrorBoundary}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-sm cursor-pointer">Developer Info</summary>
            <pre className="p-2 mt-2 overflow-auto text-xs bg-gray-100 rounded dark:bg-gray-800">
              {error?.stack}
            </pre>
          </details>
        )}
      </div>
    )
  }
}
