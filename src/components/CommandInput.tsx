import { useId, useRef, useCallback, useEffect, useMemo, memo } from 'react'
import { useCommandContext } from '@/types/context'
import { useCommandState } from '@/lib'

export interface CommandInputProps {
  placeholder?: string
  autoFocus?: boolean
  className?: string
  children?: React.ReactNode // Allow custom content/rendering
}

/**
 * Main search input for command palette.
 * Manages search query, keyboard navigation, and accessibility.
 * Headless component - style with className prop.
 */
const CommandInputComponent = function CommandInput({
  placeholder = 'Type a command or search...',
  autoFocus = false,
  className = '',
  children,
}: CommandInputProps) {
  const store = useCommandContext()

  // refs for DOM management
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate stable IDs for accessibility
  const inputId = useId()
  const listboxId = `${inputId}-listbox`

  // SUBSCRIBE TO STORE WITH OPTIMIZED SELECTOR (Single Source of Truth)

  // Single batched subscription for all state values
  const { query, open, activeId, view } = useCommandState()

  // EVENT HANDLERS

  /**
   * Handle input changes
   * Updates store directly - React batches the re-render
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      const currentView = store.getState().view

      // Single update to store
      // React will batch this with any other state updates
      store.setState({
        view: {
          ...currentView,
          query: newValue,
        },
      })
    },
    [store]
  )

  /**
   * Handle input clicks - re-enable mouse hover
   */
  const handleClick = useCallback(() => {
    // Re-enable mouse hover when clicking on the input
    store.setState({ keyboardNavigationActive: false })
  }, [store])

  /**
   * Handle key presses for special behavior
   * Prevent default for navigation keys to maintain focus, delegate to global handler
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent default for navigation keys to maintain input focus
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        return
      }
    },
    [store]
  )

  // Focus input when component mounts, when explicitly demanded, or when view changes
  // This ensures the input regains focus after navigating back from portals
  useEffect(() => {
    if (autoFocus && inputRef.current && view.showSearchInput !== false) {
      // Small delay to ensure the input is properly rendered after navigation
      setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
    }
  }, [
    autoFocus,
    view.type,
    view.portalId,
    view.categoryId,
    view.showSearchInput,
  ])

  // Render custom children or default input structure
  if (children) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={className}>
      {/* Input Field */}
      <input
        ref={inputRef}
        id={inputId}
        name="command-search"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-activedescendant={activeId || undefined}
        aria-label="Command palette search"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="flex-1 py-4 pr-4 text-lg bg-transparent outline-none "
      />
    </div>
  )
}

// Memoize to prevent unnecessary re-renders when props haven't changed
export default memo(CommandInputComponent)
