import { VirtualItem } from './useVirtualList'

/**
 * Cache entry for height calculations
 */
interface HeightCacheEntry {
  /** Cached height value */
  height: number
  /** Cache key for invalidation */
  cacheKey: string
  /** Timestamp of last access */
  lastAccessed: number
  /** Access count for LRU */
  accessCount: number
}

/**
 * Height calculation cache with LRU eviction
 */
class HeightCache {
  private cache = new Map<string, HeightCacheEntry>()
  private maxSize = 200 // Reduced for better memory usage
  private accessOrder: string[] = [] // Track access order for LRU

  constructor() {
    // No periodic cleanup - use LRU eviction instead
  }

  /**
   * Generate cache key for an item
   */
  private getCacheKey(item: VirtualItem, index: number): string {
    // Create a stable key based on item properties that affect height
    return `${item.id || 'unknown'}-${item.height || 'auto'}-${index}`
  }

  /**
   * Get cached height for an item
   */
  get(item: VirtualItem, index: number): number | null {
    const cacheKey = this.getCacheKey(item, index)
    const entry = this.cache.get(cacheKey)

    if (entry) {
      entry.lastAccessed = Date.now()
      return entry.height
    }

    return null
  }

  /**
   * Set cached height for an item
   */
  set(item: VirtualItem, index: number, height: number): void {
    const cacheKey = this.getCacheKey(item, index)

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(cacheKey, {
      height,
      cacheKey,
      lastAccessed: Date.now(),
      accessCount: 0,
    })
  }

  /**
   * Clear all cached heights
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove specific item from cache
   */
  invalidate(item: VirtualItem, index: number): void {
    const cacheKey = this.getCacheKey(item, index)
    this.cache.delete(cacheKey)
  }

  /**
   * Clean up old entries based on access time
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = 300000 // 5 minutes

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

// Lazy-loaded global cache instance
let heightCache: HeightCache | null = null

function getHeightCache(): HeightCache {
  if (!heightCache) {
    heightCache = new HeightCache()
  }
  return heightCache
}

/**
 * Smart height estimation configuration
 */
export interface HeightEstimator {
  /** Default height for standard items */
  defaultHeight: number
  /** Custom height estimation function */
  estimateHeight?: (item: VirtualItem, index: number) => number
}

/**
 * Content analysis result for height estimation
 */
export interface ContentAnalysis {
  isHeader: boolean
  isDivider: boolean
  hasDescription: boolean
  hasLongDescription: boolean
  isCompact: boolean
  isLarge: boolean
}

/**
 * Height configuration for different item types
 */
export interface HeightConfig {
  /** Standard command item height */
  default: number
  /** Header item height */
  header: number
  /** Divider/spacer height */
  divider: number
  /** Items with descriptions */
  withDescription: number
  /** Items with long descriptions */
  withLongDescription: number
  /** Compact items (recent commands, etc.) */
  compact: number
  /** Large items */
  large: number
}

/**
 * Default height configuration
 */
const DEFAULT_HEIGHTS: HeightConfig = {
  default: 56,
  header: 32,
  divider: 16,
  withDescription: 64,
  withLongDescription: 72,
  compact: 48,
  large: 80,
}

/**
 * Analyzes item content to determine optimal height
 */
export function analyzeItemContent(item: VirtualItem): ContentAnalysis {
  if (!item) {
    return {
      isHeader: false,
      isDivider: false,
      hasDescription: false,
      hasLongDescription: false,
      isCompact: false,
      isLarge: false,
    }
  }

  // Check item ID patterns for special types
  if (item.id === 'recent-commands-header' || item.id?.includes('header')) {
    return {
      isHeader: true,
      isDivider: false,
      hasDescription: false,
      hasLongDescription: false,
      isCompact: false,
      isLarge: false,
    }
  }

  if (item.id === 'recent-commands-divider' || item.id?.includes('divider')) {
    return {
      isHeader: false,
      isDivider: true,
      hasDescription: false,
      hasLongDescription: false,
      isCompact: false,
      isLarge: false,
    }
  }

  if (item.id?.startsWith('recent-')) {
    return {
      isHeader: false,
      isDivider: false,
      hasDescription: false, // Recent commands typically don't show descriptions
      hasLongDescription: false,
      isCompact: true, // Recent commands should be more compact
      isLarge: false,
    }
  }

  // For dynamic content analysis, we could inspect the render function
  // For now, use reasonable defaults based on typical command palette content
  return {
    isHeader: false,
    isDivider: false,
    hasDescription: true, // Most command items have descriptions
    hasLongDescription: false, // Assume normal length descriptions
    isCompact: false,
    isLarge: false,
  }
}

/**
 * Unified height estimator factory - consolidates all height estimation logic
 */
export function createHeightEstimator(
  config: Partial<HeightConfig> = {}
): HeightEstimator {
  const heights = { ...DEFAULT_HEIGHTS, ...config }

  return {
    defaultHeight: heights.default,

    estimateHeight: (item: VirtualItem, index: number) => {
      // Use explicit height if provided
      if (item.height) return item.height

      // Check cache first
      const cache = getHeightCache()
      const cachedHeight = cache.get(item, index)
      if (cachedHeight !== null) {
        return cachedHeight
      }

      // Perform expensive content analysis
      const contentAnalysis = analyzeItemContent(item)

      // Apply smart height rules based on content characteristics
      let calculatedHeight: number
      if (contentAnalysis.isHeader) calculatedHeight = heights.header
      else if (contentAnalysis.isDivider) calculatedHeight = heights.divider
      else if (contentAnalysis.hasLongDescription)
        calculatedHeight = heights.withLongDescription
      else if (contentAnalysis.hasDescription)
        calculatedHeight = heights.withDescription
      else if (contentAnalysis.isCompact) calculatedHeight = heights.compact
      else if (contentAnalysis.isLarge) calculatedHeight = heights.large
      else calculatedHeight = heights.default

      // Cache the result
      cache.set(item, index, calculatedHeight)

      return calculatedHeight
    },
  }
}

/**
 * Pre-configured height estimator for command palette
 */
export const commandPaletteHeightEstimator = createHeightEstimator()

/**
 * Clear all cached height calculations
 * Call this when the item list changes significantly
 */
export function clearHeightCache(): void {
  getHeightCache().clear()
}

/**
 * Invalidate cache for a specific item
 * Useful when a single item's content changes
 */
export function invalidateItemHeight(item: VirtualItem, index: number): void {
  getHeightCache().invalidate(item, index)
}

/**
 * Simple fixed height estimator
 */
export function createFixedHeightEstimator(height: number): HeightEstimator {
  return {
    defaultHeight: height,
    estimateHeight: () => height,
  }
}

/**
 * Dynamic height estimator based on content length
 */
export function createDynamicHeightEstimator(
  baseHeight: number = 56,
  descriptionHeight: number = 64,
  longDescriptionHeight: number = 72
): HeightEstimator {
  return createHeightEstimator({
    default: baseHeight,
    withDescription: descriptionHeight,
    withLongDescription: longDescriptionHeight,
  })
}

/**
 * Advanced height estimator with custom analysis function
 */
export function createAdvancedHeightEstimator(
  config: Partial<HeightConfig> = {},
  analyzeFn?: (item: VirtualItem, index: number) => ContentAnalysis
): HeightEstimator {
  const heights = { ...DEFAULT_HEIGHTS, ...config }

  return {
    defaultHeight: heights.default,
    estimateHeight: (item: VirtualItem, index: number) => {
      // Use explicit height if provided
      if (item.height) return item.height

      // Check cache first
      const cache = getHeightCache()
      const cachedHeight = cache.get(item, index)
      if (cachedHeight !== null) {
        return cachedHeight
      }

      // Perform expensive content analysis
      const contentAnalysis = analyzeFn
        ? analyzeFn(item, index)
        : analyzeItemContent(item)

      // Apply smart height rules based on content characteristics
      let calculatedHeight: number
      if (contentAnalysis.isHeader) calculatedHeight = heights.header
      else if (contentAnalysis.isDivider) calculatedHeight = heights.divider
      else if (contentAnalysis.hasLongDescription)
        calculatedHeight = heights.withLongDescription
      else if (contentAnalysis.hasDescription)
        calculatedHeight = heights.withDescription
      else if (contentAnalysis.isCompact) calculatedHeight = heights.compact
      else if (contentAnalysis.isLarge) calculatedHeight = heights.large
      else calculatedHeight = heights.default

      // Cache the result
      cache.set(item, index, calculatedHeight)

      return calculatedHeight
    },
  }
}
