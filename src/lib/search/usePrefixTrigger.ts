/**
 * What it does:
 * - Monitors every keystroke in real-time
 * - Detects when you type a prefix shortcut followed by space
 * - Instantly navigates to the right portal
 * - Prevents the prefix from triggering again when you navigate back
 */

import { useEffect, useRef } from 'react'
import { useCommandContext } from '@/types/context'
import { commandPaletteConfig } from '@/example/config/commands'

/**
 * @param query - Current search text (what user typed)
 * @param onClose - Function to close palette (for immediate actions)
 *
 * @example
 * ```tsx
 * In your component:
 * usePrefixTrigger(searchQuery, () => setPaletteOpen(false))
 * ```
 */
export function usePrefixTrigger(query: string, onClose: () => void) {
  // Connect to the global palette state
  const store = useCommandContext()

  // Remember the last query we processed (prevents double-triggering)
  const lastQueryRef = useRef<string>('')

  useEffect(() => {
    // Get current state (includes whether we just went back)
    const state = store.getState()

    // PREVENTION CHECK: Did we just come back from a navigation?
    // If so, don't retrigger the prefix (would cause infinite loops)
    if (state.lastNavigationWasBack) {
      store.setState({ lastNavigationWasBack: false }) // Reset the flag
      return // Skip processing this time
    }

    // PREVENTION CHECK: Have we already processed this exact query?
    // If so, don't retrigger (user might be backspacing or something)
    if (query === lastQueryRef.current) return

    // Remember we processed this query
    lastQueryRef.current = query

    // PATTERN RECOGNITION: Look for "shortcut + space"
    if (!query || !query.endsWith(' ')) return // Not ready yet

    const prefix = query.trim() // Remove spaces to get clean shortcut
    if (!prefix) return // Just spaces, no shortcut

    /**
     * Find the matching command
     *
     * Searches through ALL commands (including nested categories) to find
     * the one that matches this shortcut.
     *
     * @param prefix - The shortcut typed ("!g", "!yt", "!r", etc.)
     * @param items - Where to search (command tree, might have folders)
     * @returns Matching command, or null if not found
     */
    function findCommandForPrefix(
      prefix: string,
      items: any[] = commandPaletteConfig.commands || []
    ): any {
      for (const item of items) {
        // Direct match: This command has our shortcut
        if (item.prefixes?.includes(prefix)) return item

        // Check sub-commands recursively (nested categories)
        if (item.children) {
          const found = findCommandForPrefix(prefix, item.children)
          if (found) return found
        }
      }
      return null // Shortcut not found
    }

    // Search for the matching command
    const matchingCommand = findCommandForPrefix(prefix)

    if (!matchingCommand)
      return // No command matches this shortcut
      // FOUND A MATCH
    ;(async () => {
      await store.selectCommand(matchingCommand.id, onClose)
    })()
  }, [query, onClose])
}
