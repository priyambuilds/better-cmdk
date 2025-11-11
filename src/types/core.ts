/**
 * Core Types - Fundamental command palette types
 *
 * Contains the most frequently used types that are imported across the codebase.
 * Separated for better compilation performance and maintainability.
 */

import type { VirtualListConfig, HeightEstimator } from '@/lib'

/**
 * Navigation view types - determines what screen is shown
 */
export type ViewType = 'root' | 'portal' | 'category'

/**
 * Current navigation state - what view is active
 *
 * @property showSearchInput - Controls whether the search input is rendered
 *   - `true` or `undefined`: Show search input (default)
 *   - `false`: Hide search input for this view
 *   - Use `store.navigate({ ..., showSearchInput: false })` to hide input
 */
export interface ViewState {
  type: ViewType
  portalId?: string
  categoryId?: string
  query?: string
  showSearchInput?: boolean
}

/**
 * Basic command item structure
 */
export interface BaseCommand {
  id: string
  name: string
  icon?: string
  description?: string
  keywords?: string[]
}

/**
 * Command types - discriminated unions for better type safety
 */
export type Command = ActionCommand | PortalCommand | CategoryCommand

export interface ActionCommand extends BaseCommand {
  type: 'action'
  icon?: string
  prefixes?: string[]
  execute: () => void | Promise<void>
}

export interface PortalCommand extends BaseCommand {
  type: 'portal'
  icon?: string
  prefixes?: string[]
  showSearchInput?: boolean // Controls whether search input is shown for this portal
  render: (query: string, context: PortalContext) => React.ReactElement
}

export interface CategoryCommand extends BaseCommand {
  type: 'category'
  icon?: string
  children: Command[]
}

/**
 * Legacy Navigable interface removed - use Command discriminated unions
 * @deprecated This interface has been removed. Use Command types instead.
 */

/**
 * Portal context - API for portal components
 */
export interface PortalContext {
  onClose: () => void
  store?: any // Import cycle prevention
}

/**
 * Search algorithm options
 */
export type SearchAlgorithm = 'commandscore' | 'fuse'
