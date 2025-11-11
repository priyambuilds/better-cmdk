/**
 * REACT CONTEXT - STORE INJECTION FOR COMPONENTS
 *
 * This file establishes React Context for providing the CommandStore to all
 * components within the command palette tree. This enables components to
 * access global state without prop drilling.
 *
 * CONTEXT PATTERN:
 * - Context creation and provision by <Command> root component
 * - Hook-based consumption in child components
 * - Type-safe access with error boundaries
 *
 * USAGE FLOW:
 * 1. <Command> creates store and provides it via CommandContext
 * 2. Child components call useCommandContext() hook
 * 3. Components get direct access to store methods
 *
 * @see Command component in @/components/Command.tsx (provider)
 * @see createStore in @/types/store.ts (store creation)
 */

import { createContext, useContext } from 'react'
import type { CommandStore } from './store'

/**
 * SEARCH CONFIGURATION
 *
 * Configuration options for the search behavior
 */
export interface SearchConfig {
  enableCaching?: boolean
  enablePrefixBoosting?: boolean
  debounceMs?: number
  minScore?: number
  maxResults?: number
}

/**
 * COMMAND CONTEXT
 *
 * React Context for providing CommandStore and search configuration to component tree.
 * All command palette components are wrapped within this context.
 *
 * CONTEXT VALUE: Object containing store and search config, or null
 * DEFAULT: null (no store available)
 *
 * @see createContext React documentation
 */
export const CommandContext = createContext<{
  store: CommandStore
  searchConfig: SearchConfig
} | null>(null)

/**
 * COMMAND CONTEXT ACCESS HOOKS
 *
 * Retrieves data from React Context. Throws if used outside
 * the command palette component tree to prevent runtime errors.
 *
 * ERROR HANDLING:
 * - Detects misuse (calling hook outside <Command>)
 * - Provides clear error message with guidance
 * - Enforces proper component hierarchy
 */

/**
 * Get the CommandStore from context
 */
export function useCommandContext(): CommandStore {
  const context = useContext(CommandContext)

  if (!context) {
    throw new Error(
      `[useCommandContext] Hook used outside command palette tree.\n\n` +
        `HOIST THIS COMPONENT INSIDE:` +
        `\t<Command>` +
        `\t\t{ /* Your components here */ }` +
        `\t</Command>\n\n` +
        `COMMAND PALETTE COMPONENTS MUST BE WITHIN <Command> FOR STATE ACCESS.`
    )
  }

  return context.store
}

/**
 * Get the search configuration from context
 */
export function useSearchConfig(): SearchConfig {
  const context = useContext(CommandContext)

  if (!context) {
    throw new Error(
      `[useSearchConfig] Hook used outside command palette tree.\n\n` +
        `HOIST THIS COMPONENT INSIDE:` +
        `\t<Command>` +
        `\t\t{ /* Your components here */ }` +
        `\t</Command>\n\n` +
        `COMMAND PALETTE COMPONENTS MUST BE WITHIN <Command> FOR CONFIG ACCESS.`
    )
  }

  return context.searchConfig
}
