/**
 * Configuration Types - Command palette configuration options
 *
 * Contains all configuration-related types for better organization.
 * Separated to reduce compilation overhead when only config types are needed.
 */

import type { SearchAlgorithm } from './core'

/**
 * Performance configuration options
 */
export interface PerformanceConfig {
  debounceMs?: number
  maxResults?: number
  enableCaching?: boolean
  enablePrefixBoosting?: boolean
  minScore?: number
}

/**
 * Virtualization configuration
 */
export interface VirtualizationConfig {
  itemHeight?: number
  overscan?: number
  pinnedIndices?: number[]
  dynamicSizing?: boolean
}

/**
 * Fuse.js search configuration
 */
export interface FuseConfig {
  threshold?: number
  location?: number
  distance?: number
  ignoreLocation?: boolean
  includeMatches?: boolean
  minMatchCharLength?: number
  shouldSort?: boolean
  findAllMatches?: boolean
  keys?: (string | { name: string; weight?: number })[]
  getFn?: (obj: any, path: string | string[]) => string | string[]
  sortFn?: (a: any, b: any) => number
  debounceMs?: number
  enableCaching?: boolean
  enablePrefixBoosting?: boolean
  minScore?: number
  maxResults?: number
}

/**
 * Complete command palette configuration
 */
export interface CommandConfig {
  enableRecentCommands?: boolean
  loop?: boolean
  defaultSearchLibrary?: SearchAlgorithm
  performance?: PerformanceConfig
  virtualization?: boolean
  virtualizationConfig?: VirtualizationConfig
  fuseConfig?: FuseConfig
}

/**
 * Command component props
 */
export interface CommandProps {
  label: string
  config?: CommandConfig
  value?: string
  onValueChange?: (value: string) => void
  shouldFilter?: boolean
  loop?: boolean
  enableRecentCommands?: boolean
  className?: string
  children?: React.ReactNode
  virtualizationConfig?: VirtualizationConfig
  heightEstimator?: any // Import cycle prevention
}
