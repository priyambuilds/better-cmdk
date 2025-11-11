import { useCommandContext } from '@/types/context'
import { useSyncExternalStore, useCallback, memo } from 'react'

/**
 * Back button that appears when navigated into a portal or category.
 * Clicking it returns to the previous view.
 *
 * Only visible when:
 * - NOT on root view
 * - There is navigation history
 */
export interface BackButtonProps {
  className?: string
  children?: React.ReactNode
}

const BackButtonComponent = function BackButton({
  className = '',
  children,
}: BackButtonProps) {
  const store = useCommandContext()

  // Stable selectors to prevent frequent re-subscriptions
  const getView = useCallback(() => store.getState().view, [])
  const getHasHistory = useCallback(
    () => store.getState().history.length > 0,
    []
  )

  // Subscribe to view state
  const view = useSyncExternalStore(store.subscribe, getView)

  // Subscribe to history state
  const hasHistory = useSyncExternalStore(store.subscribe, getHasHistory)

  if (view.type === 'root' || !hasHistory) {
    return null
  }

  const handleBack = () => {
    store.goBack()
  }

  if (children) {
    return (
      <div className={className} onClick={handleBack}>
        {children}
      </div>
    )
  }

  return (
    <button
      onClick={handleBack}
      className={className}
      aria-label="Go back to previous view"
      tabIndex={-1} // Prevent tab focus - input should always be focused
    >
      ← Back
    </button>
  )
}

// Memoize to prevent unnecessary re-renders when props haven't changed
export default memo(BackButtonComponent, (prevProps, nextProps) => {
  // Only re-render if className changes
  return prevProps.className === nextProps.className
})
