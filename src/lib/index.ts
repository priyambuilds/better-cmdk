// Core utilities
export {
  shallowEqualArrays,
  shallowEqualObjects,
  generateCacheKey,
  findNavigableById,
  flattenNavigables,
} from './utils'

// Core virtualization hook
export {
  useVirtualList,
  type VirtualListConfig,
  type VirtualItem,
  type VirtualListResult,
} from './virtualization/useVirtualList'

// Height estimation utilities
export {
  commandPaletteHeightEstimator,
  createFixedHeightEstimator,
  createDynamicHeightEstimator,
  createAdvancedHeightEstimator,
  analyzeItemContent,
  type HeightEstimator,
  type ContentAnalysis,
} from './virtualization/virtualHeightEstimator'

// Keyboard navigation
export { useNavigationItemsUpdater as useStoreItemsUpdater } from './useCommandState'

// Keyboard navigation hook
export { useGlobalKeyboardNavigation } from './useGlobalKeyboardNavigation'

// Optimized state selector hooks
export {
  useCommandState,
  useRecentCommandsSection,
  type CommandStateSnapshot,
} from './useCommandState'
