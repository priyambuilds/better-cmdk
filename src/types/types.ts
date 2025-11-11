/**
 * Main Types Index - Re-exports from focused type modules
 */

// Re-export core types
export type {
  ViewType,
  ViewState,
  BaseCommand,
  Command,
  ActionCommand,
  PortalCommand,
  CategoryCommand,
  PortalContext,
  SearchAlgorithm,
} from './core'

// Re-export config types
export type {
  PerformanceConfig,
  VirtualizationConfig,
  FuseConfig,
  CommandConfig,
  CommandProps,
} from './config'

// Re-export navigation types
export type {
  CommandItemProps,
  CommandListProps,
  BackButtonProps,
  PortalRendererProps,
  CommandEmptyProps,
  ErrorBoundaryProps,
} from './navigation'
