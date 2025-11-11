import { useSyncExternalStore, useCallback, memo } from 'react'
import { useCommandContext } from '@/types/context'

export interface CommandEmptyProps {
  children?: React.ReactNode
  className?: string
}

const CommandEmptyComponent = function CommandEmpty({
  children = 'No results found',
  className = '',
}: CommandEmptyProps) {
  const store = useCommandContext()

  const getQuery = useCallback(() => store.getState().view.query, [])
  const query = useSyncExternalStore(store.subscribe, getQuery)

  if (!query) return null

  return (
    <div role="presentation" className={`command-empty ${className}`}>
      {children}
    </div>
  )
}

export default memo(CommandEmptyComponent)
