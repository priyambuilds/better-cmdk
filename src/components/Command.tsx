import { useId, useEffect, useRef, useState, memo } from 'react'
import { CommandContext } from '@/types/context'
import { createStore, type CommandState } from '@/types/store'
import { useGlobalKeyboardNavigation } from '@/lib'
import { preloadFuse } from '@/lib/search/algorithms'
import ErrorBoundary from './ErrorBoundary'
import type { CommandProps } from '@/types/types'

/**
 * Command Palette Root Component
 *
 * The main entry point for the command palette. Manages global state,
 * keyboard navigation, and provides context to all child components.
 *
 * @param label - Accessible label for screen readers
 * @param config - Configuration object for all palette settings
 * @param value - Controlled search value
 * @param onValueChange - Callback for controlled mode
 * @param loop - Whether keyboard navigation wraps around
 * @param enableRecentCommands - Enable recent commands feature
 * @param modal - Whether to render as a modal with overlay
 * @param className - CSS classes for styling
 * @param children - Child components (CommandInput, CommandList, etc.)
 */
const CommandComponent = function Command({
  label,
  config,
  value,
  onValueChange,
  shouldFilter,
  loop,
  enableRecentCommands,
  className = '',
  children,
  virtualizationConfig,
  heightEstimator,
  modal = false,
}: CommandProps & { modal?: boolean }) {
  const id = useId()

  // Modal state management - start closed, only open on Ctrl+K
  const [isOpen, setIsOpen] = useState(false)

  // Merged config
  const mergedConfig = {
    enableRecentCommands:
      enableRecentCommands ?? config?.enableRecentCommands ?? true,
    loop: loop ?? config?.loop ?? false,
    defaultSearchLibrary: config?.defaultSearchLibrary ?? 'fuse',
    fuseConfig: config?.fuseConfig,
    virtualization: config?.virtualization ?? false,
    virtualizationConfig: config?.virtualizationConfig,
  }

  const storeRef = useRef<ReturnType<typeof createStore> | null>(null)

  if (!storeRef.current) {
    const initialState: CommandState = {
      open: false,
      activeId: null,
      loop: mergedConfig.loop,
      view: {
        type: 'root',
        query: value ?? '',
      },
      history: [],
      recentCommands: [],
      searchLibrary: mergedConfig.defaultSearchLibrary,
      ...(mergedConfig.fuseConfig && { fuseConfig: mergedConfig.fuseConfig }),
      virtualization: mergedConfig.virtualization,
      ...(mergedConfig.virtualizationConfig && {
        virtualizationConfig: mergedConfig.virtualizationConfig,
      }),
    }

    storeRef.current = createStore(initialState, {
      enableRecentCommands: mergedConfig.enableRecentCommands,
    })
    // Load recent commands from storage
    storeRef.current.init()
    // Preload Fuse.js only if it's the default algorithm for better performance
    if (mergedConfig.defaultSearchLibrary === 'fuse') {
      preloadFuse()
    }
  }

  const store = storeRef.current

  useEffect(() => {
    if (value !== undefined) {
      const currentView = store.getState().view
      store.setState({
        view: {
          ...currentView,
          query: value,
        },
      })
    }
  }, [value, store])

  useEffect(() => {
    if (mergedConfig.loop !== undefined) {
      store.setState({ loop: mergedConfig.loop })
    }
  }, [mergedConfig.loop, store])

  // Extract search config from merged config
  const searchConfig = {
    enableCaching: mergedConfig.fuseConfig?.enableCaching ?? true,
    enablePrefixBoosting: mergedConfig.fuseConfig?.enablePrefixBoosting ?? true,
    debounceMs: mergedConfig.fuseConfig?.debounceMs ?? 300,
    minScore: mergedConfig.fuseConfig?.minScore ?? 0.1,
    maxResults: mergedConfig.fuseConfig?.maxResults ?? 50,
  }

  // Use the extracted keyboard navigation hook
  useGlobalKeyboardNavigation(store)

  // Cleanup store on unmount
  useEffect(() => {
    return () => {
      store.destroy()
    }
  }, [store])

  // Get current state for accessibility announcements
  const state = store.getState()
  const activeItem = state.activeId
  const currentView = state.view

  // Modal keyboard handling
  useEffect(() => {
    if (!modal) return

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Toggle command palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(prev => !prev)
        return
      }

      // Escape: Handle navigation or close palette when open
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        const state = store.getState()
        const currentView = state.view

        if (currentView.query) {
          // Clear query first
          store.setState({
            view: {
              ...currentView,
              query: '',
            },
          })
        } else if (currentView.type !== 'root') {
          // If no query and not in root view, go back
          store.goBack()
        } else {
          // If no query and in root view, close the palette
          setIsOpen(false)
        }
        return
      }

      // For other keys when modal is open, prevent default to stop page scrolling
      if (
        isOpen &&
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight')
      ) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, {
        capture: true,
      })
    }
  }, [modal, isOpen])

  // Don't render anything when modal is closed
  if (modal && !isOpen) return null

  const dialogContent = (
    <CommandContext value={{ store, searchConfig }}>
      <div
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-describedby={`${id}-status`}
        id={id}
        tabIndex={-1} // Prevent dialog from being focusable
        onMouseDown={e => e.preventDefault()} // Prevent focus changes when clicking anywhere
      >
        {/* Status announcements for screen readers */}
        <div
          id={`${id}-status`}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          Command palette dialog.
          {activeItem && ` Item ${activeItem} is selected.`}
          {currentView.query && ` Searching for "${currentView.query}".`}
        </div>

        {/* Search results live region */}
        <div
          id={`${id}-results`}
          className="sr-only"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Search results"
        >
          {currentView.query && `Searching for "${currentView.query}"`}
        </div>

        {/* Keyboard navigation announcements */}
        <div
          id={`${id}-navigation`}
          className="sr-only"
          aria-live="assertive"
          aria-atomic="true"
        >
          {activeItem && `Selected: ${activeItem}`}
        </div>

        {children}
      </div>
    </CommandContext>
  )

  // Render modal with overlay if modal prop is true
  if (modal) {
    return (
      <ErrorBoundary
        isolationLevel="global"
        recoveryStrategy="reload"
        onError={(error, errorInfo) => {
          // Error handled by ErrorBoundary component
        }}
      >
        {/* Prevent body scrolling when modal is open */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            body { overflow: hidden !important; }
          `,
          }}
        />
        {/* Modal Overlay */}
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 bg-black/50"
          onClick={e => {
            // Only close if clicking directly on the overlay, not on child elements
            if (e.target === e.currentTarget) {
              setIsOpen(false)
            }
          }}
          onKeyDown={e => {
            // Prevent arrow keys from scrolling the page
            if (
              e.key === 'ArrowUp' ||
              e.key === 'ArrowDown' ||
              e.key === 'ArrowLeft' ||
              e.key === 'ArrowRight'
            ) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          tabIndex={-1} // Prevent modal overlay from being focusable
        >
          {/* Modal Content */}
          <div
            className="w-full max-w-[600px] animate-in fade-in duration-200"
            onClick={e => {
              e.stopPropagation()
            }} // Prevent clicks from closing the modal
            tabIndex={-1} // Prevent modal content from being focusable
          >
            {dialogContent}
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  // Render inline dialog if modal prop is false
  return dialogContent
}

// Memoize to prevent unnecessary re-renders when props haven't changed
export default memo(CommandComponent)
