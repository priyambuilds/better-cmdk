/**
 * List container for command items with full keyboard navigation support.
 *
 * Uses the new virtualization library for improved performance and maintainability.
 * Handles arrow keys, Enter, Escape, Home/End keys. Provides accessible
 * listbox role and smooth scrolling to active items. Supports virtualization
 * for improved performance with large lists.
 */

import React, { useMemo, memo, useCallback, useEffect } from 'react'
import {
  useVirtualList,
  VirtualItem,
  commandPaletteHeightEstimator,
  type VirtualListConfig,
  HeightEstimator,
  useCommandState,
} from '@/lib'
import { useCommandContext } from '@/types/context'
import CommandItem from './CommandItem'

export interface CommandItemData {
  id: string
  name: string
  icon?: string
  description?: string | undefined
  keywords?: string[] | undefined
  onSelect: () => void
}

export interface CommandListProps {
  children?: React.ReactNode
  className?: string
  virtualItems?: VirtualItem[]
  commands?: CommandItemData[]
  renderItem: (command: CommandItemData) => React.ReactNode
  virtualizationConfig?: VirtualListConfig
  heightEstimator?: HeightEstimator
}

const CommandListComponent = function CommandList({
  children,
  className = '',
  virtualItems,
  commands,
  renderItem,
  virtualizationConfig,
  heightEstimator,
}: CommandListProps) {
  // Use optimized state selector
  const { activeId, loop, view } = useCommandState()
  const store = useCommandContext()

  // Get scroll trigger and navigation direction to determine scrolling behavior
  const scrollTrigger = store.getState().scrollTrigger
  const navigationDirection = store.getState().navigationDirection

  // Create virtual items from commands if provided
  const commandVirtualItems = useMemo(() => {
    if (!commands) return []
    return commands.map(cmd => ({
      id: cmd.id,
      render: () => renderItem(cmd),
    }))
  }, [commands, renderItem])

  // Use provided virtualItems or generated ones from commands
  const finalVirtualItems = virtualItems || commandVirtualItems || []

  // Calculate active index for keyboard navigation
  const activeIndex = useMemo(
    () => finalVirtualItems.findIndex(item => item.id === activeId),
    [finalVirtualItems, activeId]
  )

  // Handle active index change
  const handleActiveIndexChange = useCallback(
    (index: number) => {
      store.setState({ activeId: finalVirtualItems[index]?.id })
    },
    [finalVirtualItems, store]
  )

  // Set up virtualization
  const virtualList = useVirtualList(
    finalVirtualItems,
    virtualizationConfig,
    heightEstimator || commandPaletteHeightEstimator
  )

  // Memoize render content function to prevent recreation
  const renderContent = useMemo(() => {
    if (finalVirtualItems.length === 0) {
      return null
    }

    // Virtualized rendering
    if (virtualList.isVirtualized) {
      return (
        <div
          style={{
            height: `${virtualList.totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualList.virtualItems.map(virtualItem => {
            const item = finalVirtualItems[virtualItem.index]
            if (!item) return null

            return (
              <div
                key={item.id}
                data-virtual-index={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item.render()}
              </div>
            )
          })}
        </div>
      )
    }

    // Regular rendering (fallback)
    return finalVirtualItems.map((item, index) => {
      return (
        <div key={item.id} data-virtual-index={index}>
          {item.render()}
        </div>
      )
    })
  }, [
    finalVirtualItems,
    virtualList.isVirtualized,
    virtualList.totalSize,
    virtualList.virtualItems,
  ])

  // Handle scrolling for both virtualized and non-virtualized lists
  useEffect(() => {
    // Early return conditions
    if (scrollTrigger !== 'keyboard' || activeIndex < 0) return

    const activeItem = finalVirtualItems[activeIndex]
    if (!activeItem) return

    if (virtualList.isVirtualized) {
      virtualList.scrollToIndex(activeIndex, { align: 'auto' })
    } else {
      // Handle non-virtualized scrolling directly
      const container = virtualList.containerRef.current
      if (!container) return

      const element = container.querySelector(
        `[id="${activeItem.id}"]`
      ) as HTMLElement
      if (!element) return

      // Use the browser's native scrollIntoView for smooth, native scrolling
      element.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'auto',
      })
    }
  }, [activeIndex, scrollTrigger]) // Only depend on what actually changes the scroll behavior

  // Keyboard navigation is now handled globally by Command.tsx
  // No need for fallback handler here

  return (
    <div
      ref={virtualList.containerRef}
      className={className}
      style={{
        position: 'relative',
      }}
      aria-label="Command list"
      aria-busy={false}
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {finalVirtualItems.length > 0 &&
          `${finalVirtualItems.length} items available. ${
            activeIndex >= 0
              ? `Item ${activeIndex + 1} of ${finalVirtualItems.length} selected.`
              : ''
          }`}
      </div>

      {renderContent}
    </div>
  )
}

// Export without memo for now - can be optimized later
export default CommandListComponent
