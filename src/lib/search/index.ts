/**
 * Search Module - Simple Search API
 */

// Core search function
export {
  searchItems,
  type SearchAlgorithm,
  SEARCH_CONFIG,
  FUSE_CONFIG,
} from './algorithms'

// Utility functions
export { findNavigableById, flattenNavigables } from '../utils'

// Search hooks
export { useSearch, type SearchConfig } from './useSearch'

// Re-export types for convenience
export type { Command } from '@/types/types'
