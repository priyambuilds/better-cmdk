/**
 * Search Types - Search and filtering related types
 *
 * Contains types specific to search algorithms, caching.
 * Separated for better compilation performance and organization.
 */

import type { SearchAlgorithm } from './core'

/**
 * Fuse instance with lookup map
 */
export interface FuseInstance {
  search: (query: string) => any[]
  __stringToItemMap: Map<string, any>
}

/**
 * Search algorithm interface
 */
export interface SearchAlgorithmType {
  calculateItemScore: (
    item: any,
    query: string,
    algorithm: SearchAlgorithm,
    fuseInstance?: FuseInstance | null
  ) => number
  filterAndScoreItems: (
    items: any[],
    query: string,
    algorithm: SearchAlgorithm,
    fuseInstance?: FuseInstance | null,
    minScore?: number,
    maxResults?: number,
    options?: any
  ) => any[]
}

/**
 * Search engine configuration
 */
export interface SearchEngineConfig {
  algorithm?: SearchAlgorithm
  minScore?: number
  maxResults?: number
  enablePrefixBoosting?: boolean
}

/**
 * Search cache configuration
 */
export interface SearchCacheConfig {
  enabled?: boolean
  capacity?: number
  maxMemory?: number
}

/**
 * Command filter hook result
 */
export interface CommandFilterResult {
  query: string
  filteredCommands: any[]
  categorizedCommands: any[]
  recentCommandObjects: any[]
  view: any
  virtualizationConfig?: any
}
