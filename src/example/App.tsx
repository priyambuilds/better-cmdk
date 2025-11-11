import { useMemo, useCallback } from 'react'
import CommandInput from '@/components/CommandInput'
import Command from '@/components/Command'
import CommandList from '@/components/CommandList'
import CommandItem from '@/components/CommandItem'
import CommandEmpty from '@/components/CommandEmpty'
import BackButton from '@/components/BackButton'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useCommandContext, useSearchConfig } from '@/types/context'
import { useSearch } from '@/lib/search'
import { usePrefixTrigger } from '@/lib/search/usePrefixTrigger'
import { useStoreItemsUpdater } from '@/lib'
import { useCommandState, useRecentCommandsSection } from '@/lib'
import { commandPaletteConfig } from '@/example/config/commands'
import PortalRenderer from '@/components/PortalRenderer'
import type { Command as CommandType } from '@/types/types'
import type { CommandItemData } from '@/components/CommandList'

export default function App() {
  return (
    <Command
      label="Command Palette"
      modal={true}
      className="h-[480px] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg shadow-2xl dark:bg-gray-900 dark:border-gray-700"
      config={{
        enableRecentCommands: true,
        loop: true,
        virtualization: false, // Enable virtualization for performance
        virtualizationConfig: {
          itemHeight: 64, // Updated to match height estimator for items with descriptions
          overscan: 10, // Increased overscan for smoother scrolling
          dynamicSizing: true, // Enable dynamic height measurement
        },
        defaultSearchLibrary: 'fuse', // Configure Fuse.js as primary search library
        fuseConfig: {
          minScore: 0.1, // Minimum score threshold for search results
          maxResults: 50, // Maximum number of search results to return
          includeMatches: false, // Don't return match indices by default (for highlighting)
          minMatchCharLength: 1, // Include single character matches
          shouldSort: true, // Sort results by relevance
          findAllMatches: false, // Stop at first perfect match
          ignoreLocation: true, // Search anywhere in strings for better prefix matching
          enablePrefixBoosting: true, // Enable prefix priority scoring
          enableCaching: true, // Enable result caching
          debounceMs: 150, // Debounce delay for search
        },
      }}
    >
      <AppContent onClose={() => {}} />
    </Command>
  )
}

/**
 * AppContent Component - Main palette logic
 *
 * Separated from App for cleaner architecture:
 * - App handles modal state and shortcuts
 * - AppContent handles command logic and rendering
 */
interface AppContentProps {
  onClose: () => void
}

function AppContent({ onClose }: AppContentProps) {
  // Core hooks handle all the complex logic
  const store = useCommandContext()
  const searchConfig = useSearchConfig()
  const { activeId } = useCommandState()
  const handleCommandSelect = useCallback(
    async (commandId: string) => {
      await store.selectCommand(commandId, onClose)
    },
    [store, onClose]
  )
  const {
    query,
    filteredCommands,
    recentCommandObjects,
    view,
    virtualizationConfig,
  } = useSearch(
    commandPaletteConfig.commands || commandPaletteConfig.navigables || [],
    undefined,
    searchConfig
  )

  // Extract virtualization settings for easier access
  const isVirtualizationEnabled = virtualizationConfig?.enabled || false

  // Handle immediate prefix execution when space is pressed (configured in commands.ts)
  usePrefixTrigger(query, onClose)

  // Get portal/category data for rendering and keyboard navigation
  const portalData = useMemo(() => {
    if (view.type === 'portal' || view.type === 'category') {
      return PortalRenderer({
        portalId: view.portalId || view.categoryId || '',
        query,
        onClose,
        store,
      })
    }
    return null
  }, [view.type, view.portalId, view.categoryId, query, onClose, store])

  // Extract category commands for keyboard navigation
  const categoryCommands = useMemo(() => {
    return portalData?.type === 'category' ? portalData.commands : undefined
  }, [portalData])

  // Update store items for keyboard navigation
  useStoreItemsUpdater(
    filteredCommands,
    recentCommandObjects,
    query,
    view.type,
    view.portalId || view.categoryId,
    categoryCommands
  )

  // Memoized recent commands section
  const recentCommandsSection = useRecentCommandsSection(
    query,
    recentCommandObjects,
    handleCommandSelect
  )

  // Memoized main commands to prevent recreation on every render
  const mainCommands = useMemo(
    () =>
      filteredCommands.map((cmd: CommandType) => ({
        id: cmd.id,
        name: cmd.name,
        icon: cmd.icon || '',
        description: cmd.description || '',
        keywords: cmd.keywords || [],
        onSelect: () => handleCommandSelect(cmd.id),
      })),
    [filteredCommands, handleCommandSelect]
  )

  // Memoized combined commands array
  const allCommands = useMemo(
    () => [...recentCommandsSection, ...mainCommands],
    [recentCommandsSection, mainCommands]
  )

  return (
    <>
      {/* Header area - fully customizable by users */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center p-4">
          {/* Back button - only show when not in root view */}
          {view.type !== 'root' && (
            <BackButton className="flex items-center gap-2 mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <span>←</span>
              <span className="text-sm font-medium">Back</span>
            </BackButton>
          )}

          {/* Search input area - conditionally visible based on view settings */}
          {view.showSearchInput !== false && (
            <div className="relative flex-1">
              <svg
                className="absolute left-0 w-4 h-4 text-gray-400 transform -translate-y-1/2 top-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <CommandInput
                placeholder="Type a command or search..."
                autoFocus
                className="w-full pl-6 text-gray-900 placeholder-gray-500 bg-transparent outline-none dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Conditional rendering based on view type */}
      {view.type === 'root' ? (
        <div className="h-[400px] flex flex-col">
          <CommandList
            commands={allCommands}
            renderItem={(cmd: CommandItemData) => {
              // Handle section header
              if (cmd.id === 'recent-commands-header') {
                return (
                  <div className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    {cmd.name}
                  </div>
                )
              }

              // Handle section divider
              if (cmd.id === 'recent-commands-divider') {
                return (
                  <div className="mx-4 my-1 border-t border-gray-200 dark:border-gray-700" />
                )
              }

              // Regular command items
              const isItemActive = activeId === cmd.id
              return (
                <CommandItem
                  id={cmd.id}
                  value={cmd.id}
                  keywords={cmd.keywords || []}
                  onSelect={cmd.onSelect}
                  className={`flex items-center gap-4 px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-blue-50 active:dark:bg-blue-600/20 ${isItemActive ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''}`}
                  isActive={isItemActive}
                >
                  <div className="flex items-center flex-1 gap-4">
                    <span className="shrink-0 text-lg opacity-70">
                      {cmd.icon || '➡️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-base leading-tight text-gray-900 dark:text-gray-100">
                        {cmd.name}
                      </div>
                      {cmd.description && (
                        <div className="text-sm leading-tight text-gray-500 truncate dark:text-gray-400">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              )
            }}
            virtualizationConfig={{
              enabled: isVirtualizationEnabled,
              ...virtualizationConfig,
            }}
            className="flex-1 py-2 overflow-x-hidden overflow-y-auto"
          />
          {/* Empty state */}
          <CommandEmpty className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            {query ? 'No commands found' : 'Start typing to search...'}
          </CommandEmpty>
        </div>
      ) : (
        // PORTAL/CATEGORY VIEWS - Use same CommandList as home view for consistency
        <ErrorBoundary
          isolationLevel="feature"
          recoveryStrategy="retry"
          maxRetries={2}
        >
          {(() => {
            // Call PortalRenderer as a function to get data/result
            const portalResult = PortalRenderer({
              portalId: view.portalId || view.categoryId || '',
              query,
              onClose,
              store,
            })

            if (!portalResult) {
              // Command not found
              return (
                <div className="p-8 text-center">
                  <div className="mb-4 text-4xl">❓</div>
                  <h3 className="mb-2 text-lg font-semibold">
                    Command Not Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    The requested command could not be found.
                  </p>
                </div>
              )
            }

            if (portalResult.type === 'portal') {
              // Render JSX element for custom portals
              return portalResult.element
            }

            if (portalResult.type === 'category') {
              // Render category using same CommandList as home view
              return (
                <div className="h-[400px] flex flex-col">
                  <CommandList
                    commands={portalResult.commands}
                    renderItem={(cmd: CommandItemData) => {
                      const isItemActive = activeId === cmd.id
                      return (
                        <CommandItem
                          id={cmd.id}
                          value={cmd.id}
                          keywords={cmd.keywords || []}
                          onSelect={cmd.onSelect}
                          className={`flex items-center gap-4 px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-blue-50 active:dark:bg-blue-600/20 ${isItemActive ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''}`}
                          isActive={isItemActive}
                        >
                          <div className="flex items-center flex-1 gap-4">
                            <span className="shrink-0 text-lg opacity-70">
                              {cmd.icon || '➡️'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-base leading-tight text-gray-900 dark:text-gray-100">
                                {cmd.name}
                              </div>
                              {cmd.description && (
                                <div className="text-sm leading-tight text-gray-500 truncate dark:text-gray-400">
                                  {cmd.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      )
                    }}
                    virtualizationConfig={{
                      enabled: isVirtualizationEnabled,
                      ...virtualizationConfig,
                    }}
                    className="flex-1 py-2 overflow-x-hidden overflow-y-auto"
                  />
                  {/* Empty state for categories */}
                  <CommandEmpty className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    {query
                      ? 'No items found'
                      : `No items in ${portalResult.title}`}
                  </CommandEmpty>
                </div>
              )
            }

            return null
          })()}
        </ErrorBoundary>
      )}
    </>
  )
}
