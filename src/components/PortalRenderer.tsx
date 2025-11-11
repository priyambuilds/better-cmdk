import { memo, lazy, Suspense } from 'react'
import { commandPaletteConfig } from '@/example/config/commands'
import { searchItems } from '@/lib/search'
import type { Command, PortalCommand, CategoryCommand } from '@/types/types'
import type { CommandItemData } from './CommandList'

interface PortalRendererProps {
  portalId: string
  query: string
  onClose: () => void
  store?: any
}

export interface CategoryData {
  type: 'category'
  title: string
  commands: CommandItemData[]
}

export interface PortalData {
  type: 'portal'
  element: React.ReactElement
}

export type PortalRendererResult = CategoryData | PortalData | null

/**
 * Unified Portal Renderer - Returns data for categories, JSX for portals
 *
 * This component no longer renders its own lists. Instead:
 * - For categories: Returns command data to be rendered by CommandList (same as home view)
 * - For portals: Returns JSX elements for custom interfaces
 * - This ensures categories behave exactly like the home view with same search/virtualization/navigation
 */
const PortalRendererComponent = function PortalRenderer({
  portalId,
  query,
  onClose,
  store,
}: PortalRendererProps): PortalRendererResult {
  // Get commands from config
  const commands = commandPaletteConfig.commands || []

  // Find the command/portal by ID (searches nested categories recursively)
  function findCommandById(
    id: string,
    items: Command[] = commands
  ): Command | undefined {
    for (const item of items) {
      if (item.id === id) return item
      // Check sub-commands recursively for categories
      if (item.type === 'category' && item.children) {
        const found = findCommandById(id, item.children)
        if (found) return found
      }
    }
    return undefined
  }

  const command = findCommandById(portalId)

  // Handle category commands - return command data for CommandList to render
  if (command?.type === 'category' && command.children) {
    // Filter category children based on search query using same algorithm as root
    const searchAlgorithm = store?.getState?.()?.searchLibrary || 'commandscore'
    const filteredChildren = query
      ? searchItems(
          command.children,
          query,
          searchAlgorithm,
          command.children.length
        )
      : command.children

    const categoryCommands: CommandItemData[] = filteredChildren.map(child => ({
      id: child.id,
      name: child.name,
      icon: child.icon || '',
      description: child.description || '',
      keywords: child.keywords || [],
      onSelect: async () => {
        // Use the store's selectCommand for consistent behavior
        if (store) {
          await store.selectCommand(child.id, onClose)
        }
      },
    }))

    return {
      type: 'category',
      title: command.name,
      commands: categoryCommands,
    }
  }

  // Handle portal commands - return JSX element with lazy loading
  if (command?.type === 'portal') {
    try {
      // Create a lazy-loaded portal component
      const LazyPortal = lazy(() =>
        Promise.resolve({
          default: () => command.render(query, { onClose, store }),
        })
      )

      return {
        type: 'portal',
        element: (
          <Suspense
            fallback={
              <div className="p-8 text-center">
                <div className="mb-4 text-4xl">⏳</div>
                <h3 className="mb-2 text-lg font-semibold">
                  Loading {command.name}...
                </h3>
                <p className="text-red-600 dark:text-red-500">
                  Please wait while we prepare this feature.
                </p>
              </div>
            }
          >
            <LazyPortal />
          </Suspense>
        ),
      }
    } catch (error) {
      return {
        type: 'portal',
        element: (
          <div className="p-8 text-center">
            <div className="mb-4 text-4xl">❌</div>
            <h3 className="mb-2 text-lg font-semibold">
              Failed to load portal
            </h3>
            <p className="text-red-600 dark:text-red-500">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ),
      }
    }
  }

  // Command not found
  return null
}

// Export the function directly (not as a memoized React component)
export default PortalRendererComponent
