import commandScore from 'command-score'
import type { Command } from '@/types/types'

/**
 * Search Configuration Constants
 * Centralized constants for search behavior
 */
export const SEARCH_CONFIG = {
  /** Minimum relevance score for showing results */
  MIN_SCORE: 0.1,
  /** Maximum results to return */
  MAX_RESULTS: 50,
  /** Debounce delay for search input (milliseconds) */
  DEBOUNCE_MS: 150,
} as const

/**
 * Fuse.js Configuration - Optimized for command palette
 */
export const FUSE_CONFIG = {
  threshold: 0.4,
  includeScore: true,
  includeMatches: false,
  minMatchCharLength: 2,
  shouldSort: true,
  findAllMatches: false,
  ignoreLocation: true,
} as const

// Dynamic Fuse.js loading
let fuseModule: typeof import('fuse.js') | null = null
let fuseLoadingPromise: Promise<typeof import('fuse.js')> | null = null

/**
 * Dynamically load Fuse.js when first needed
 */
async function loadFuse(): Promise<typeof import('fuse.js')> {
  if (fuseModule) {
    return fuseModule
  }

  if (fuseLoadingPromise) {
    return fuseLoadingPromise
  }

  // Start loading Fuse.js
  fuseLoadingPromise = import('fuse.js')

  try {
    fuseModule = await fuseLoadingPromise
    return fuseModule
  } catch (error) {
    console.warn('Failed to load Fuse.js:', error)
    throw error
  }
}

/**
 * Check if Fuse.js is available (already loaded)
 */
function isFuseAvailable(): boolean {
  return fuseModule !== null
}

/**
 * Preload Fuse.js in the background for improved performance
 * Call this early in the application lifecycle if you expect to use Fuse.js
 */
export function preloadFuse(): void {
  if (!isFuseAvailable() && !fuseLoadingPromise) {
    loadFuse().catch(error => {
      console.warn('Fuse.js preload failed:', error)
    })
  }
}

/**
 * Get Fuse.js loading status
 */
export function getFuseStatus():
  | 'not-loaded'
  | 'loading'
  | 'loaded'
  | 'failed' {
  if (fuseModule) return 'loaded'
  if (fuseLoadingPromise) return 'loading'
  return 'not-loaded'
}

export type SearchAlgorithm = 'commandscore' | 'fuse'

/**
 * Asynchronous search function that dynamically loads Fuse.js when needed
 */
export async function searchItemsAsync(
  items: Command[],
  query: string,
  algorithm: SearchAlgorithm = 'commandscore',
  maxResults: number = 50
): Promise<Command[]> {
  if (!query) {
    return items.slice(0, maxResults)
  }

  if (algorithm === 'fuse') {
    // Load Fuse.js if not already loaded
    if (!isFuseAvailable()) {
      await loadFuse()
    }
    return searchWithFuse(items, query, maxResults)
  }

  return searchWithCommandScore(items, query, maxResults)
}

/**
 * Simple search function using either command-score or Fuse.js
 * Triggers background loading of Fuse.js when fuse algorithm is requested
 * Note: For dynamic loading optimization, consider lazy-loading Fuse.js
 * when algorithm === 'fuse' to reduce initial bundle size
 */
export function searchItems(
  items: Command[],
  query: string,
  algorithm: SearchAlgorithm = 'commandscore',
  maxResults: number = 50
): Command[] {
  if (!query) {
    return items.slice(0, maxResults)
  }

  if (algorithm === 'fuse') {
    try {
      return searchWithFuse(items, query, maxResults)
    } catch (error) {
      // Fuse.js not available, fall back to command-score
      console.warn(
        'Fuse.js not available, falling back to command-score:',
        error instanceof Error ? error.message : String(error)
      )
      return searchWithCommandScore(items, query, maxResults)
    }
  }

  return searchWithCommandScore(items, query, maxResults)
}

/**
 * Synchronous search function for immediate results
 * Falls back to command-score if Fuse.js is not loaded
 */
export function searchItemsSync(
  items: Command[],
  query: string,
  algorithm: SearchAlgorithm = 'commandscore',
  maxResults: number = 50
): Command[] {
  if (!query) {
    return items.slice(0, maxResults)
  }

  // For synchronous calls, prefer command-score for reliability
  // Fuse.js can be loaded dynamically when needed
  if (algorithm === 'fuse') {
    try {
      return searchWithFuse(items, query, maxResults)
    } catch (error) {
      console.warn(
        'Fuse.js not available, falling back to command-score:',
        error instanceof Error ? error.message : String(error)
      )
      return searchWithCommandScore(items, query, maxResults)
    }
  }

  return searchWithCommandScore(items, query, maxResults)
}

/**
 * Search using Fuse.js
 */
function searchWithFuse(
  items: Command[],
  query: string,
  maxResults: number
): Command[] {
  // If Fuse.js is not loaded, throw error to trigger fallback
  if (!fuseModule) {
    throw new Error('Fuse.js not loaded')
  }

  const { default: Fuse } = fuseModule

  const searchableStrings = items.flatMap(item => [
    item.name,
    ...(item.keywords || []),
    ...(item.type === 'action' || item.type === 'portal'
      ? item.prefixes || []
      : []),
  ])

  const stringToItemMap = new Map<string, Command>()
  items.forEach(item => {
    stringToItemMap.set(item.name, item)
    item.keywords?.forEach(kw => stringToItemMap.set(kw, item))
    if (item.type === 'action' || item.type === 'portal') {
      item.prefixes?.forEach(prefix => stringToItemMap.set(prefix, item))
    }
  })

  const fuse = new Fuse(searchableStrings, {
    threshold: 0.4,
    includeScore: true,
    shouldSort: true,
  })

  const results = fuse.search(query)
  const matchedItems = new Set<Command>()

  const scoredResults: Array<{ item: Command; score: number }> = []

  for (const result of results) {
    if (result.score !== undefined) {
      const item = stringToItemMap.get(result.item)
      if (item && !matchedItems.has(item)) {
        matchedItems.add(item)
        const score = Math.max(0, Math.min(1, 1 - result.score))
        scoredResults.push({ item, score })
      }
    }
  }

  return scoredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ item }) => item)
}

/**
 * Search using command-score
 */
function searchWithCommandScore(
  items: Command[],
  query: string,
  maxResults: number
): Command[] {
  const scoredItems = items.map(item => {
    let score = commandScore(item.name, query)

    if (item.keywords?.length) {
      item.keywords.forEach((keyword: string) => {
        const keywordScore = commandScore(keyword, query)
        score = Math.max(score, keywordScore)
      })
    }

    if (
      (item.type === 'action' || item.type === 'portal') &&
      item.prefixes?.length
    ) {
      item.prefixes.forEach((prefix: string) => {
        const prefixScore = commandScore(prefix, query)
        score = Math.max(score, prefixScore)
      })
    }

    return { item, score }
  })

  return scoredItems
    .filter(({ score }) => score >= 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ item }) => item)
}
