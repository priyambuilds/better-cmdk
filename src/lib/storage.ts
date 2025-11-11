/**
 * Simplified storage utilities for command palette persistence
 */

const STORAGE_KEY = 'commandPalette_recent'
const SEARCH_LIBRARY_KEY = 'commandPalette_searchLibrary'
const FUSE_CONFIG_KEY = 'commandPalette_fuseConfig'
const MAX_RECENT_COMMANDS = 10

/**
 * Simple storage manager for basic persistence
 */
class SimpleStorageManager {
  /**
   * Get value from storage
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const result = await chrome.storage.local.get(key)
      return result[key] ?? defaultValue
    } catch (error) {
      console.warn(`Failed to get ${key} from storage:`, error)
      return defaultValue
    }
  }

  /**
   * Set value in storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value })
    } catch (error) {
      console.warn(`Failed to set ${key} in storage:`, error)
    }
  }
}

// Global storage manager instance
const storageManager = new SimpleStorageManager()

/**
 * Loads recent commands from storage
 */
export async function loadRecentCommands(): Promise<string[]> {
  return (await storageManager.get(STORAGE_KEY, [])) as string[]
}

/**
 * Saves recent commands
 */
export async function saveRecentCommands(commands: string[]): Promise<void> {
  await storageManager.set(STORAGE_KEY, commands)
}

/**
 * Loads search library preference
 */
export async function loadSearchLibrary(): Promise<
  'fuse' | 'commandscore' | null
> {
  const library = await storageManager.get(SEARCH_LIBRARY_KEY)
  return library === 'fuse' || library === 'commandscore' ? library : null
}

/**
 * Saves search library preference
 */
export async function saveSearchLibrary(
  library: 'fuse' | 'commandscore'
): Promise<void> {
  await storageManager.set(SEARCH_LIBRARY_KEY, library)
}

/**
 * Loads Fuse.js configuration
 */
export async function loadFuseConfig(): Promise<Record<string, any> | null> {
  return (await storageManager.get(FUSE_CONFIG_KEY, null)) ?? null
}

/**
 * Saves Fuse.js configuration
 */
export async function saveFuseConfig(
  config: Record<string, any>
): Promise<void> {
  await storageManager.set(FUSE_CONFIG_KEY, config)
}

/**
 * Maximum number of recent commands to remember
 */
export { MAX_RECENT_COMMANDS }
