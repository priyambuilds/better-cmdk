import {
  useSyncExternalStore,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import { useCommandContext } from '@/types/context'
import { shallowEqualArrays, shallowEqualObjects } from './utils'
import type { CommandState } from '@/types/store'
import type { Command } from '@/types/types'
import type { CommandItemData } from '@/components/CommandList'

/**
 * Optimized state selector hook that batches all store subscriptions
 * to reduce re-renders and improve performance.
 *
 * Instead of multiple useSyncExternalStore calls, this provides
 * a single subscription with all commonly used state values.
 */
export interface CommandStateSnapshot {
  query: string
  open: boolean
  activeId: string | null | undefined
  view: CommandState['view']
  loop: boolean
  items: CommandState['items']
  virtualization: boolean
  virtualizationConfig: CommandState['virtualizationConfig']
  searchLibrary: CommandState['searchLibrary']
  recentCommands: string[]
}

/**
 * Optimized state selector with selective updates
 * Only triggers re-renders when the selected data actually changes
 */
export function useCommandState(): CommandStateSnapshot {
  const store = useCommandContext()
  const lastSnapshotRef = useRef<CommandStateSnapshot | null>(null)

  const getSnapshot = useCallback((): CommandStateSnapshot => {
    const state = store.getState()
    const newSnapshot: CommandStateSnapshot = {
      query: state.view.query || '',
      open: state.open,
      activeId: state.activeId,
      view: state.view,
      loop: state.loop,
      items: state.items,
      virtualization: state.virtualization || false,
      virtualizationConfig: state.virtualizationConfig,
      searchLibrary: state.searchLibrary,
      recentCommands: state.recentCommands || [],
    }

    // If this is the first call, return the snapshot
    if (!lastSnapshotRef.current) {
      lastSnapshotRef.current = newSnapshot
      return newSnapshot
    }

    const current = lastSnapshotRef.current

    // Fast path: check if anything changed at all
    const hasChanged =
      current.query !== newSnapshot.query ||
      current.open !== newSnapshot.open ||
      current.activeId !== newSnapshot.activeId ||
      current.loop !== newSnapshot.loop ||
      current.virtualization !== newSnapshot.virtualization ||
      current.searchLibrary !== newSnapshot.searchLibrary ||
      !shallowEqualObjects(current.view, newSnapshot.view) ||
      !shallowEqualObjects(
        current.virtualizationConfig,
        newSnapshot.virtualizationConfig
      ) ||
      !shallowEqualArrays(current.recentCommands, newSnapshot.recentCommands) ||
      current.items !== newSnapshot.items

    if (hasChanged) {
      lastSnapshotRef.current = newSnapshot
      return newSnapshot
    }

    // Return cached snapshot if nothing changed
    return current
  }, [store])

  return useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    // Server-side fallback (not used in extension)
    () => ({
      query: '',
      open: false,
      activeId: null,
      view: { type: 'root' },
      loop: false,
      items: undefined,
      virtualization: false,
      virtualizationConfig: undefined,
      searchLibrary: 'commandscore',
      recentCommands: [],
    })
  )
}

/**
 * Focused hook for updating navigation items in the store
 * Separated from state reading for better performance and maintainability
 */
export function useNavigationItemsUpdater(
  filteredCommands: Command[] = [],
  recentCommandObjects: Command[] = [],
  query: string = '',
  viewType: string = 'root',
  portalId?: string,
  categoryCommands?: CommandItemData[]
): void {
  const store = useCommandContext()

  // Update navigation items when dependencies change
  useEffect(() => {
    let newItems: Array<{ id: string; index: number }> = []
    let newActiveId: string | null = null

    if (viewType === 'root') {
      let currentIndex = 0

      // Recent commands section (only when no query)
      if (!query && recentCommandObjects.length > 0) {
        // Skip header and divider for keyboard navigation - only include actual commands
        newItems = newItems.concat(
          recentCommandObjects.map(cmd => ({
            id: `recent-${cmd.id}`, // Use the virtual item ID
            index: currentIndex++,
          }))
        )
      }

      // Main commands
      newItems = newItems.concat(
        filteredCommands.map(cmd => ({
          id: cmd.id,
          index: currentIndex++,
        }))
      )

      // Set activeId to first item if items exist
      newActiveId = newItems.length > 0 ? newItems[0]?.id || null : null
    } else if (viewType === 'category' && categoryCommands) {
      // For categories with provided commands, use them directly
      newItems = categoryCommands.map((cmd, index) => ({
        id: cmd.id,
        index,
      }))
      newActiveId = newItems.length > 0 ? newItems[0]?.id || null : null
    } else if (viewType === 'portal' && portalId) {
      // Clear items for custom portals (they handle their own interaction)
      newItems = []
      newActiveId = null
    } else {
      // Clear items for other views
      newItems = []
      newActiveId = null
    }

    // Only update if items or activeId actually changed
    const currentState = store.getState()
    const itemsChanged =
      JSON.stringify(currentState.items) !== JSON.stringify(newItems)

    // Preserve current activeId if it's valid and keyboard navigation is active
    let finalActiveId = newActiveId
    if (currentState.activeId && currentState.keyboardNavigationActive) {
      // Check if current activeId is still in the new items
      const isCurrentActiveValid = newItems.some(
        item => item.id === currentState.activeId
      )
      if (isCurrentActiveValid) {
        finalActiveId = currentState.activeId
      }
    }

    const activeIdChanged = currentState.activeId !== finalActiveId

    if (itemsChanged || activeIdChanged) {
      store.setState({
        items: newItems,
        activeId: finalActiveId,
        scrollTrigger: currentState.keyboardNavigationActive
          ? currentState.scrollTrigger || 'keyboard'
          : 'auto',
      })
    }
  }, [
    filteredCommands,
    recentCommandObjects,
    query,
    viewType,
    portalId,
    categoryCommands,
    store,
  ])
}

/**
 * Custom hook to generate recent commands section data with memoization
 */
export function useRecentCommandsSection(
  query: string,
  recentCommandObjects: Command[],
  handleCommandSelect: (commandId: string) => void
) {
  return useMemo(() => {
    if (query || recentCommandObjects.length === 0) return []

    return [
      // Section header
      {
        id: 'recent-commands-header',
        name: 'Recent Commands',
        icon: '🕒',
        description: '',
        keywords: [],
        onSelect: () => {}, // No action for header
      },
      // Recent command items
      ...recentCommandObjects.map((cmd: Command) => ({
        id: `recent-${cmd.id}`,
        name: cmd.name,
        icon: cmd.icon || '',
        description: cmd.description || '',
        keywords: cmd.keywords || [],
        onSelect: () => handleCommandSelect(cmd.id),
      })),
      // Section divider
      {
        id: 'recent-commands-divider',
        name: '',
        icon: '',
        description: '',
        keywords: [],
        onSelect: () => {}, // No action for divider
      },
    ]
  }, [query, recentCommandObjects, handleCommandSelect])
}
