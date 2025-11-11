/**
 * Centralized Utility Functions
 *
 * Common utility functions used across the codebase.
 * This module consolidates duplicated utilities for better maintainability.
 */

/**
 * Shallow comparison utility for arrays
 */
export function shallowEqualArrays(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Shallow comparison utility for objects
 */
export function shallowEqualObjects<T extends Record<string, any>>(
  a: T | undefined,
  b: T | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!(key in b) || a[key] !== b[key]) return false
  }

  return true
}

/**
 * Cache Key Generator - Create Consistent Cache Keys 🔑
 *
 * Generates consistent cache keys for search results.
 * Includes all factors that affect search results.
 *
 * @param query - Search query
 * @param algorithm - Search algorithm
 * @param resultType - Optional result type filter
 * @returns Cache key string
 */
export function generateCacheKey(
  query: string,
  algorithm: string,
  resultType?: string
): string {
  const baseKey = `${query}:${algorithm}`
  return resultType ? `${baseKey}:${resultType}` : baseKey
}

/**
 * ID Finder
 *
 * Like finding a specific book in a library using its catalog number.
 * Recursively searches nested categories (folders within folders).
 *
 * @param id - The unique ID we're looking for
 * @param items - Where to search (might have sub-folders)
 * @returns The found item, or null if not found
 */
export function findNavigableById<
  T extends {
    id: string
    children?: T[] // Optional nested items
  },
>(id: string, items: T[]): T | null {
  for (const item of items) {
    if (item.id === id) return item
    // Check sub-folders recursively
    if (item.children) {
      const found = findNavigableById(id, item.children)
      if (found) return found
    }
  }
  return null
}

/**
 * Tree Flattener
 *
 * Imagine you have folders inside folders inside folders. This flattens
 * everything into one big list so search can find ANYTHING, no matter how deep.
 *
 * Why? So typing "calculator" finds the calculator even if it's buried in
 * "Math Tools > Advanced > Special Calculators > Scientific Calculator"
 *
 * @param navigables - Nested category structure
 * @returns Single flat array of all discoverable items
 */
export function flattenNavigables<
  T extends {
    id: string
    name: string
    keywords?: string[]
    category?: string
    icon?: string
    description?: string
    type?: string
    skipScoring?: boolean
    children?: T[] // Nested sub-items
    prefixes?: string[] // Shortcut prefixes
  },
>(navigables: T[]): T[] {
  const result: T[] = []

  function recurse(items: T[]): void {
    for (const item of items) {
      result.push(item) // Add the current item

      // Recursively add all children (flatten the tree)
      if (item.children && item.children.length > 0) {
        recurse(item.children)
      }
    }
  }

  recurse(navigables)
  return result
}
