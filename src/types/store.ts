/**
 * Command Palette Store - The "Brain" of the Application
 *
 * It remembers what screen you're on, what you're typing, and tells
 * all your app's parts when things change so they can update themselves.
 *
 * WHY THIS EXISTS:
 * - Components can't talk to each other directly in Chrome extensions
 * - We need one central place to remember the user's current state
 * - React components must re-render when data changes (subscriptions)
 * - Your recent commands persist even after closing Chrome
 *
 * HOW IT WORKS:
 * 1. createStore() makes our memory "bank"
 * 2. Components "subscribe" to get notified of changes
 * 3. When state changes, all subscribers automatically update
 * 4. Navigation saves breadcrumbs for the back button
 */

import { unstable_batchedUpdates } from 'react-dom'
import type {
  ViewState,
  SearchAlgorithm,
  FuseConfig,
  VirtualizationConfig,
} from './types'
import { commandPaletteConfig } from '@/example/config/commands'
import {
  loadRecentCommands,
  saveRecentCommands,
  loadSearchLibrary,
  saveSearchLibrary,
  MAX_RECENT_COMMANDS,
} from '@/lib/storage'

/**
 * Command Palette State Interface
 */
export interface CommandState {
  open: boolean
  activeId: string | null | undefined
  loop: boolean
  view: ViewState
  history: ViewState[]
  recentCommands: string[]
  lastNavigationWasBack?: boolean
  searchLibrary?: SearchAlgorithm
  fuseConfig?: FuseConfig
  virtualization?: boolean
  virtualizationConfig?: VirtualizationConfig
  items?: Array<{ id: string; index: number }>
  scrollTrigger?: 'keyboard' | 'auto' | 'hover'
  keyboardNavigationActive?: boolean
  navigationDirection?: 'up' | 'down'
}

// INTERNAL TYPES -

/**
 * A notification sent to components when store state changes.
 */
type Subscriber = () => void

/**
 * Information about each component that wants updates.
 * We track when they signed up for notifications, their ID, etc.
 */
interface SubscriptionMeta {
  /** Function to call to notify this component */
  callback: Subscriber
  /** Unique ID for this subscription */
  id: number
  /** When this component started listening */
  mountedAt: number
  /** Last time we notified this component */
  lastActive: number
  /** Selector function to determine if component should update */
  selector?: (state: CommandState) => any
  /** Last selected value to avoid unnecessary updates */
  lastValue?: any
}

// STORE API INTERFACE - What the Store Does

// Public methods of the store
interface CommandStore {
  subscribe: (callback: () => void) => () => void // Listen for state changes
  getState: () => CommandState // Get current state
  setState: (partial: Partial<CommandState>) => void // Update part of state
  navigate: (newView: ViewState) => void // Go to different view (portal, category, etc.)
  selectCommand: (commandId: string, onClose?: () => void) => Promise<void> // Execute a command
  goBack: () => boolean // Go back to previous view
  init: () => Promise<void> // Load saved data when app starts
  addRecentCommand: (commandId: string) => Promise<void> // Remember user used this command
  destroy: () => void // Clean up all resources and listeners
  cleanup?: () => void // Remove all listeners (only in development)
}

/**
 * Creates a command store instance
 *
 * Like a factory - we call this once to get our store.
 * The store manages all the app's state: views, queries, command history.
 *
 * @param initialState Starting state (what the app looks like when first opened)
 * @returns Store with methods to manage state
 */
export interface CommandStoreConfig {
  enableRecentCommands: boolean
}

export function createStore(
  initialState: CommandState,
  config: CommandStoreConfig
): CommandStore {
  // PRIVATE STATE - only the store can change this
  // Starts with whatever we pass in, then gets updated as user interacts
  let state = initialState
  // CONFIG - immutable, affects behavior
  const storeConfig = config

  // SUBSCRIPTION SYSTEM - tracks which components want state updates
  // When state changes, everyone in this list gets notified
  const subscribers = new Map<number, SubscriptionMeta>() // Map of ID → subscriber info
  let nextSubscriptionId = 0 // Counter to give each subscriber a unique ID

  /**
   * SUBSCRIBE
   *
   * Components call this when they want to know when store state changes.
   * Like subscribing to a newsletter - you'll get notified every time something important happens.
   *
   * IMPORTANT: Always call the returned function when your component unmounts (cleanup)
   * to prevent memory leaks. This is critical for React components!
   *
   * @param callback Function to call whenever any state changes
   * @returns Function that removes this subscription (call on unmount!)
   * @example
   *   const unsubscribe = store.subscribe(() => {
   *     console.log('The store changed!')
   *   })
   *
   *   Later, when component unmounts:
   *   unsubscribe() // Clean up!
   */
  function subscribe(callback: Subscriber): () => void {
    // Generate a unique ID for this subscriber
    const id = nextSubscriptionId++
    // Record the current time for tracking
    const now = Date.now()
    // Create metadata for this subscription
    const meta: SubscriptionMeta = {
      callback,
      id,
      mountedAt: now,
      lastActive: now,
    }
    // Add this subscriber to the set of subscribers
    subscribers.set(id, meta)

    // --- What does this function return? ---
    // It returns a function (called an "unsubscribe" or "cleanup" function).
    // When you call this returned function, it will remove this subscriber from the store.
    // This is useful in React, for example, to stop listening when a component unmounts.
    return () => {
      const prevSize = subscribers.size
      // Try to remove this subscriber by its ID
      const wasRemoved = subscribers.delete(id)
      // In development, log if something unexpected happens
      if (process.env.NODE_ENV === 'development') {
        if (!wasRemoved) {
          // Development warning removed for production bundle size
        } else if (prevSize === 30 || prevSize === 20 || prevSize === 10) {
          // Development logging removed for production bundle size
        }
      }
    }
  }

  /**
   * Notifies all registered subscribers by calling their callback functions.
   * Uses React's batched updates to prevent excessive re-renders during rapid state changes.
   *
   * This function batches all subscriber notifications to minimize re-renders.
   * If a subscriber's callback throws an error, the error is logged, and the subscriber is removed.
   *
   * Steps:
   * 1. Defer notification to avoid calling flushSync during render
   * 2. Get the current time.
   * 3. Batch all subscriber callbacks using React's unstable_batchedUpdates
   * 4. Update lastActive timestamps and call callbacks
   * 5. Remove any subscribers whose callbacks failed.
   *
   * This prevents multiple re-renders when multiple state updates happen in quick succession.
   */
  function notifySubscribers() {
    // Defer to next microtask to avoid flushSync during render
    queueMicrotask(() => {
      const now = Date.now()
      const brokenSubscribers: number[] = []

      // Batch all subscriber notifications to prevent excessive re-renders
      unstable_batchedUpdates(() => {
        subscribers.forEach((meta, id) => {
          try {
            meta.lastActive = now
            meta.callback() // This calls the component's update function!
          } catch (error) {
            brokenSubscribers.push(id)
          }
        })
      })

      // Clean up broken subscribers after batch completes
      if (brokenSubscribers.length > 0) {
        queueMicrotask(() => {
          brokenSubscribers.forEach(id => subscribers.delete(id))
        })
      }
    })
  }

  /**
   * GET STATE
   *
   * The main way components read the current state of everything.
   * Returns all the current app state in one object.
   *
   * Like taking a snapshot of exactly what's happening in the app.
   *
   * @returns Complete current state (view, query, recent commands, etc.)
   */
  function getState(): CommandState {
    return state
  }

  /**
   * SET STATE
   *
   * Updates part or all of the app's state. React-style immutable updates.
   * Triggers all subscribed components to re-render with fresh data.
   *
   * STATE IS IMMUTABLE: We create new state objects instead of modifying existing ones.
   * This makes debugging easier and prevents weird bugs.
   *
   * @param partial Only the parts of state you want to change
   * @example store.setState({ view: newView }) // Change only the current view
   */
  function setState(partial: Partial<CommandState>): void {
    const oldState = state
    // Create new state (immutable - never modify existing state!)
    state = { ...state, ...partial }

    // Only notify subscribers if something actually changed
    if (oldState !== state) {
      notifySubscribers()
    }
  }

  /**
   * NAVIGATE
   *
   * Changes what screen/view the user is looking at.
   * Automatically saves the current view to history for the back button.
   *
   * Think of it like changing rooms in a house:
   * - Remember where you came from (history)
   * - You can always go back to the previous room
   *
   * @param newView Where you want to go
   * @example store.navigate({ type: 'portal', portalId: 'calculator' })
   */
  function navigate(newView: ViewState): void {
    const currentView = state.view // Remember where we are now

    setState({
      view: newView, // Go to new place
      history: [...state.history, currentView], // Save current for back button
    })
  }

  /**
   * GO BACK
   *
   * Uses the saved navigation history to go back to previous screens.
   * Like clicking the back button in a web browser.
   *
   * @returns true if successfully went back, false if nowhere to go
   * @example
   *   if (store.goBack()) {
   *     console.log('Went back successfully!')
   *   } else {
   *     console.log('Can\'t go back - at beginning!')
   *   }
   */
  function goBack(): boolean {
    const history = state.history

    // Can't go back if no history
    if (history.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        // Development warning removed for production bundle size
      }
      return false
    }

    // Get the previous place from history
    const previousView = history[history.length - 1]
    if (!previousView) {
      return false
    }

    // Go back by restoring the previous state
    setState({
      view: previousView, // Display previous screen
      history: history.slice(0, -1), // Remove it from history
      lastNavigationWasBack: true, // Flag to prevent prefix retriggering
    })

    return true
  }

  /**
   * INITIALIZE
   *
   * Loads saved data when the app first starts up.
   * Specifically loads recent commands and search library preference from Chrome's storage.
   *
   * Call this once when the app launches, before showing anything to users.
   *
   * @returns Promise that resolves when loading is complete
   * @example await store.init() // Load all saved data before showing UI
   */
  async function init(): Promise<void> {
    try {
      // Load search library preference (prioritize saved over initial)
      const savedSearchLibrary = await loadSearchLibrary()
      const searchLibrary =
        savedSearchLibrary !== null ? savedSearchLibrary : state.searchLibrary!

      // Only update if different from current
      if (searchLibrary !== state.searchLibrary) {
        setState({ searchLibrary })
      }

      if (storeConfig.enableRecentCommands) {
        // Load recent commands from Chrome storage
        const recentCommands = await loadRecentCommands()
        setState({ recentCommands }) // Update app state
      }
    } catch (error) {
      // Silently fail in production
    }
  }

  /**
   * ADD RECENT COMMAND
   *
   * Remembers that the user just used a command.
   * Moves it to the top of the "recent" list and saves to Chrome storage.
   *
   * @param commandId The command that was just used
   * @example store.addRecentCommand('google-search') // Remember Google was used
   */
  async function addRecentCommand(commandId: string): Promise<void> {
    const current = state.recentCommands || []

    // Remove this command from anywhere in the list (prevents duplicates)
    const withoutThis = current.filter(id => id !== commandId)

    // Put it at the front (most recent), keep only the latest 10
    const updated = [commandId, ...withoutThis].slice(0, MAX_RECENT_COMMANDS)

    // Update state and save to Chrome storage for next time
    setState({ recentCommands: updated })
    await saveRecentCommands(updated)
  }

  /**
   * SELECT COMMAND
   *
   * Handles execution of a command when selected by user.
   * Can execute immediately, navigate to portal, or navigate to category.
   *
   * @param commandId The command to execute
   * @param onClose Optional function to close palette after immediate actions
   */
  async function selectCommand(
    commandId: string,
    onClose?: () => void
  ): Promise<void> {
    // Find the command in our menu (searches nested categories too)
    function findCommandById(
      id: string,
      items: any[] = commandPaletteConfig.commands || []
    ): any {
      for (const item of items) {
        if (item.id === id) return item
        // Check sub-menus recursively
        if (item.children) {
          const found = findCommandById(id, item.children)
          if (found) return found
        }
      }
      return null
    }

    const command = findCommandById(commandId)

    if (!command) {
      // Command not found - silently fail in production
      return
    }

    try {
      // Remember this command was used (shows up in "recent" next time)
      if (storeConfig.enableRecentCommands) {
        await addRecentCommand(commandId)
      }

      // Decide what to do based on the command type
      if (command.type === 'action') {
        // Action
        await command.execute() // Run the action
        onClose?.() // Close palette (user is done)
      } else if (command.type === 'category') {
        // Category Navigation
        navigate({
          type: 'category', // Go to category view
          categoryId: commandId, // Which category
          query: '', // Clear search (start fresh)
        })
      } else if (command.type === 'portal') {
        // Portal navigation
        navigate({
          type: 'portal', // Go to portal view
          portalId: commandId, // Which portal
          query: '', // Clear search (start fresh)
          showSearchInput: command.showSearchInput, // Use command's search input setting
        })
      }
    } catch (error) {
      // Silently fail in production
    }
  }

  /**
   * DESTROY: "Complete Cleanup - Production Safe"
   *
   * Completely cleans up all resources and subscriptions.
   * Safe to call in production for proper memory management.
   *
   * @example store.destroy() // Clean up all resources before app shutdown
   */
  function destroy(): void {
    // Clear all subscriptions
    subscribers.clear()

    // Reset state to initial values
    state = initialState

    // Reset subscription counter
    nextSubscriptionId = 0
  }

  // Public methods that developers use (the API)
  const store: CommandStore = {
    subscribe, // Listen for changes
    getState, // Read current state
    setState, // Change state
    navigate, // Go to new view
    selectCommand, // Execute a command
    goBack, // Go back to previous
    init, // Load saved data
    addRecentCommand, // Track command usage
    destroy, // Complete cleanup
  }

  return store
}

// Export the type so other files know what store looks like
export type { CommandStore }
