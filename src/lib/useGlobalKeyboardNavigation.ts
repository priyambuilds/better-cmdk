import { useCallback, useEffect } from 'react'
import type { CommandStore } from '@/types/store'

/**
 * Hook for handling global keyboard navigation in the command palette.
 * Extracted from Command.tsx to reduce component complexity.
 */
/**
 * Check if the key is a navigation key that should be handled globally
 */
function isNavigationKey(key: string): boolean {
  return ['ArrowUp', 'ArrowDown', 'Enter'].includes(key)
}

/**
 * Calculate the next index for keyboard navigation
 */
function calculateNextIndex(
  currentIndex: number,
  key: string,
  itemsLength: number,
  loop: boolean
): number {
  if (key === 'ArrowDown') {
    return currentIndex < itemsLength - 1
      ? currentIndex + 1
      : loop
        ? 0
        : currentIndex
  } else {
    return currentIndex > 0
      ? currentIndex - 1
      : loop
        ? itemsLength - 1
        : currentIndex
  }
}

export function useGlobalKeyboardNavigation(store: CommandStore) {
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't interfere with input fields - let them handle their own events
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Early return for non-navigation keys
      if (!isNavigationKey(e.key)) {
        return
      }

      const state = store.getState()
      const items = state.items || []

      // Prevent default behavior for navigation keys to avoid page scrolling
      e.preventDefault()
      e.stopPropagation()

      // Early return if no items
      if (items.length === 0) {
        if (process.env.NODE_ENV === 'development') {
        }
        return
      }

      // Find current index
      const currentIndex = state.activeId
        ? items.findIndex(item => item.id === state.activeId)
        : -1

      // Handle Enter key for selection
      if (e.key === 'Enter' && currentIndex >= 0) {
        const currentItem = items[currentIndex]
        if (currentItem) {
          if (process.env.NODE_ENV === 'development') {
          }
          store.selectCommand(currentItem.id)
        }
        return
      }

      // Calculate and set new active index
      const newIndex = calculateNextIndex(
        currentIndex,
        e.key,
        items.length,
        state.loop
      )

      // Early return if no index change needed
      if (
        newIndex === currentIndex ||
        newIndex < 0 ||
        newIndex >= items.length
      ) {
        if (process.env.NODE_ENV === 'development') {
        }
        return
      }

      const targetItem = items[newIndex]
      if (!targetItem) return

      if (process.env.NODE_ENV === 'development') {
      }

      store.setState({
        activeId: targetItem.id,
        scrollTrigger: 'keyboard',
        keyboardNavigationActive: true,
        navigationDirection: e.key === 'ArrowDown' ? 'down' : 'up',
      })

      // Scrolling and focusing is now handled by CommandList
    },
    [store]
  )

  // Add global keyboard listener when component mounts
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, {
        capture: true,
      })
    }
  }, [handleGlobalKeyDown])
}
