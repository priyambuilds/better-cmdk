import {
  useVirtualizer,
  VirtualItem as TanStackVirtualItem,
} from '@tanstack/react-virtual'
import { useCallback, useRef, useState, useEffect } from 'react'
import type { HeightEstimator } from './virtualHeightEstimator'

/**
 * Configuration for virtualization behavior
 */
export interface VirtualListConfig {
  /** Height of each item in pixels */
  itemHeight?: number
  /** Number of items to render outside visible area */
  overscan?: number
  /** Indices of items that should always be visible (pinned) */
  pinnedIndices?: number[]
  /** Whether virtualization is enabled */
  enabled?: boolean
  /** Auto-enable threshold: number of items before virtualization kicks in */
  autoThreshold?: number
  /** Enable dynamic height measurement using ResizeObserver */
  dynamicSizing?: boolean
}

/**
 * Represents a virtual item to be rendered
 */
export interface VirtualItem<T = any> {
  /** Unique identifier for the item */
  id: string
  /** Explicit height override (optional) */
  height?: number
  /** Data associated with the item */
  data?: T
  /** Render function for the item */
  render: () => React.ReactNode
}

/**
 * Return type of the useVirtualList hook
 */
export interface VirtualListResult {
  /** Reference to attach to the scroll container */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Total height of all items */
  totalSize: number
  /** Array of virtual items to render */
  virtualItems: TanStackVirtualItem[]
  /** Function to scroll to a specific index */
  scrollToIndex: (
    index: number,
    options?: { align?: 'start' | 'center' | 'end' | 'auto' }
  ) => void
  /** Whether virtualization is currently active */
  isVirtualized: boolean
}

/**
 * Core virtualization hook that provides a clean, reusable interface
 * for virtualizing large lists with minimal configuration.
 */
export function useVirtualList<T = any>(
  items: VirtualItem<T>[],
  config: VirtualListConfig = {},
  heightEstimator?: HeightEstimator
): VirtualListResult {
  const containerRef = useRef<HTMLDivElement>(null)

  // Default configuration
  const {
    itemHeight = 56,
    overscan = 5,
    pinnedIndices = [],
    enabled = true,
    autoThreshold = 10, // Auto-enable virtualization for 10+ items
    dynamicSizing = false,
  } = config

  // Cache for measured heights when using dynamic sizing
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(
    new Map()
  )

  // Strict virtualization control: only enable when explicitly requested
  const shouldVirtualize =
    enabled === true && // Must be explicitly enabled
    items.length > 0 // Has items

  // Smart height estimation with dynamic sizing support
  const estimateSize = useCallback(
    (index: number) => {
      // Early return when virtualization is disabled for better performance
      if (!shouldVirtualize) return itemHeight

      const item = items[index]
      if (!item) return itemHeight

      // Use explicit height if provided
      if (item.height) return item.height

      // Use measured height if available and dynamic sizing is enabled
      if (dynamicSizing && measuredHeights.has(index)) {
        return measuredHeights.get(index)!
      }

      // Use custom estimator if provided
      if (heightEstimator?.estimateHeight) {
        return heightEstimator.estimateHeight(item, index)
      }

      // Use default height
      return heightEstimator?.defaultHeight ?? itemHeight
    },
    [
      items,
      itemHeight,
      shouldVirtualize,
      heightEstimator,
      dynamicSizing,
      measuredHeights,
    ]
  )

  // ResizeObserver for dynamic height measurement
  useEffect(() => {
    if (!dynamicSizing || !shouldVirtualize) return

    const resizeObserver = new ResizeObserver(entries => {
      const newHeights = new Map(measuredHeights)

      entries.forEach(entry => {
        const index = parseInt(
          entry.target.getAttribute('data-virtual-index') || '-1'
        )
        if (index >= 0) {
          const height = entry.contentRect.height
          if (height > 0) {
            newHeights.set(index, height)
          }
        }
      })

      if (
        newHeights.size !== measuredHeights.size ||
        Array.from(newHeights.entries()).some(
          ([idx, h]) => measuredHeights.get(idx) !== h
        )
      ) {
        setMeasuredHeights(newHeights)
      }
    })

    // Observe currently rendered items
    const container = containerRef.current
    if (container) {
      const items = container.querySelectorAll('[data-virtual-index]')
      items.forEach(item => resizeObserver.observe(item))
    }

    return () => resizeObserver.disconnect()
  }, [dynamicSizing, shouldVirtualize, measuredHeights])

  // Reset measured heights when items change
  useEffect(() => {
    if (dynamicSizing) {
      setMeasuredHeights(new Map())
    }
  }, [items.length, dynamicSizing])

  // Create virtualizer instance
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan,

    // Custom range extractor for pinned items
    rangeExtractor: useCallback(
      range => {
        // Extract visible indices from range
        const visibleIndices = []
        for (let i = range.startIndex; i <= range.endIndex; i++) {
          visibleIndices.push(i)
        }
        // Merge pinned items with visible range
        return [...new Set([...pinnedIndices, ...visibleIndices])].sort(
          (a, b) => a - b
        )
      },
      [pinnedIndices]
    ),

    // Only enable when virtualization is active
    enabled: shouldVirtualize,
  })

  // Scroll to index helper - only used for virtualized lists
  const scrollToIndex = useCallback(
    (
      index: number,
      options: { align?: 'start' | 'center' | 'end' | 'auto' } = {}
    ) => {
      if (shouldVirtualize && virtualizer) {
        // Use virtualizer for virtualized lists
        virtualizer.scrollToIndex(index, {
          align: options.align ?? 'auto',
          behavior: 'auto',
        })
      }
      // Non-virtualized scrolling is now handled directly in CommandList component
    },
    [shouldVirtualize, virtualizer]
  )

  return {
    containerRef,
    totalSize: shouldVirtualize ? virtualizer.getTotalSize() : 0,
    virtualItems: shouldVirtualize ? virtualizer.getVirtualItems() : [],
    scrollToIndex,
    isVirtualized: shouldVirtualize,
  }
}
