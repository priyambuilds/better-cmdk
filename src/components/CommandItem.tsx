import { useId, useSyncExternalStore, useCallback, memo } from 'react'
import { useCommandContext } from '@/types/context'
import type { CommandItemProps } from '@/types/types'

const CommandItemComponent = function CommandItem({
  id: providedId,
  value,
  keywords = [],
  disabled = false,
  onSelect,
  skipScoring = false,
  className = '',
  isActive = false,
  children,
}: CommandItemProps) {
  const store = useCommandContext()

  // Generate stable ID if not provided
  const generatedId = useId()
  const id = providedId || generatedId

  const handleClick = () => {
    if (disabled) return
    // Re-enable mouse hover when clicking anywhere in the palette
    store.setState({ keyboardNavigationActive: false })
    onSelect?.(value)
  }

  // Removed mouse hover selection - only clicking should select items

  return (
    <div
      id={id}
      role="option"
      aria-selected={isActive}
      aria-disabled={disabled}
      data-command-item=""
      data-disabled={disabled ? '' : undefined}
      data-active={isActive ? '' : undefined}
      tabIndex={-1} // Prevent tab focus - input should always be focused
      onClick={handleClick}
      className={`${className} ${isActive ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''}`}
    >
      {children}
    </div>
  )
}

export default memo(CommandItemComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.skipScoring === nextProps.skipScoring &&
    prevProps.className === nextProps.className &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.onSelect === nextProps.onSelect &&
    // Deep compare keywords array
    JSON.stringify(prevProps.keywords) === JSON.stringify(nextProps.keywords)
  )
})
