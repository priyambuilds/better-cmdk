/**
 * Navigation Types - View and navigation related types
 *
 * Contains types specific to navigation between views, portals, and categories.
 * Separated for better organization and compilation performance.
 */

import type { ViewType, ViewState, PortalContext } from './core'
import type { ReactNode } from 'react'

/**
 * Command item props for individual selectable items
 */
export interface CommandItemProps {
  id?: string
  value: string
  keywords?: string[]
  disabled?: boolean
  onSelect?: (value: string) => void
  skipScoring?: boolean
  className?: string
  children?: React.ReactNode
  isActive?: boolean
}

/**
 * Command list props for rendering collections of items
 */
export interface CommandListProps {
  children?: React.ReactNode
  className?: string
  virtualItems?: any[] // Import cycle prevention
  commands?: any[] // Import cycle prevention
  renderItem: (command: any) => React.ReactNode // Import cycle prevention
  virtualizationConfig?: any // Import cycle prevention
  heightEstimator?: any // Import cycle prevention
}

/**
 * Back button props for navigation
 */
export interface BackButtonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Portal renderer props
 */
export interface PortalRendererProps {
  portalId: string
  query: string
  onClose: () => void
}

/**
 * Empty state props
 */
export interface CommandEmptyProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  isolationLevel?: 'component' | 'feature' | 'global'
  recoveryStrategy?: 'retry' | 'fallback' | 'reload'
  maxRetries?: number
}
