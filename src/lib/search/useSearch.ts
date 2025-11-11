/**
 * Single hook that provides all search functionality.
 * Combines search engine, caching, and filtering into one cohesive API.
 *
 * This replaces the previous focused hooks (useSearchEngine, useSearchCache)
 * for a simpler, more maintainable interface.
 */

import {
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
  useDeferredValue,
} from 'react'
import { useCommandContext } from '@/types/context'
import { useCommandState } from '@/lib'
import {
  searchItems,
  flattenNavigables,
  type SearchAlgorithm,
  SEARCH_CONFIG,
} from './index'
import type { Command } from '@/types/types'

/**
 * Search Configuration
 */
export interface SearchConfig {
  /** Search algorithm to use */
  algorithm?: SearchAlgorithm
  /** Maximum results to return */
  maxResults?: number
}

/**
 * Search Hook Result
 */
export interface SearchResult {
  /** Current search query */
  query: string
  /** Filtered commands */
  filteredCommands: Command[]
  /** Recent command objects */
  recentCommandObjects: Command[]
  /** Current view state */
  view: any
  /** Virtualization configuration */
  virtualizationConfig?: any
}

/**
 * Simple Search Hook with Debouncing and Caching
 */
export function useSearch(
  items: Command[],
  categories?: Array<{
    id: string
    name: string
    icon: string
    description: string
    commandIds: string[]
  }>,
  config: SearchConfig = {}
): SearchResult {
  const store = useCommandContext()
  const { searchLibrary } = useCommandState()

  const { maxResults = 50 } = config
  const algorithm = searchLibrary || 'commandscore'

  const state = store.getState()
  const {
    view,
    recentCommands,
    virtualization,
    virtualizationConfig: storeVirtConfig,
  } = state

  const query = view.query || ''

  // Search cache
  const cacheRef = useRef<Map<string, Command[]>>(new Map())

  // Debounce search query using useDeferredValue for better performance
  const debouncedQuery = useDeferredValue(query)

  // Flatten all nested commands for root-level search
  const flattenedItems = useMemo(() => {
    return flattenNavigables(items)
  }, [items])

  // Get filtered commands with caching
  const filteredCommands = useMemo(() => {
    if (!debouncedQuery) return flattenedItems.slice(0, maxResults)

    const cacheKey = `${debouncedQuery}:${algorithm}:${maxResults}`

    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)!
    }

    // Perform search on flattened items
    const results = searchItems(
      flattenedItems,
      debouncedQuery,
      algorithm,
      maxResults
    )

    // Cache results (limit cache size to 50 for better memory usage)
    if (cacheRef.current.size > 50) {
      const firstKey = cacheRef.current.keys().next().value
      if (firstKey) {
        cacheRef.current.delete(firstKey)
      }
    }
    cacheRef.current.set(cacheKey, results)

    return results
  }, [debouncedQuery, flattenedItems, algorithm, maxResults])

  // Recent commands
  const flattenedCommands = useMemo(() => {
    const result = new Map<string, Command>()
    const flatten = (cmds: Command[]) => {
      for (const item of cmds) {
        result.set(item.id, item)
        if (item.type === 'category' && item.children) flatten(item.children)
      }
    }
    flatten(items)
    return result
  }, [items])

  const recentCommandObjects = useMemo(() => {
    if (!recentCommands || recentCommands.length === 0) return []
    return recentCommands
      .map(id => flattenedCommands.get(id))
      .filter((cmd): cmd is Command => cmd !== null)
  }, [recentCommands, flattenedCommands])

  // Virtualization config
  const virtualizationConfig = useMemo(() => {
    if (view.type !== 'root' || !virtualization) return undefined
    return {
      enabled: virtualization,
      itemHeight: storeVirtConfig?.itemHeight ?? 48,
      overscan: storeVirtConfig?.overscan ?? 5,
    }
  }, [view.type, virtualization, storeVirtConfig])

  return {
    query: debouncedQuery,
    filteredCommands,
    recentCommandObjects,
    view,
    virtualizationConfig,
  }
}
