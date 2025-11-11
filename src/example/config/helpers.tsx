import { useState } from 'react'

/**
 * Optional Helper Components for Portal Development
 *
 * These components provide common patterns for building portals
 * without forcing any particular structure. Users can use them,
 * extend them, or ignore them entirely.
 */

export interface PortalLayoutProps {
  title: string
  icon?: string
  children: React.ReactNode
}

export function PortalLayout({ title, icon, children }: PortalLayoutProps) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        {icon && <span className="text-2xl">{icon}</span>}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
}

export function Input({ value, onChange, ...props }: InputProps) {
  return (
    <input
      className="w-full p-3 text-lg border rounded-lg"
      value={value}
      onChange={e => onChange(e.target.value)}
      {...props}
    />
  )
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const styles = {
    primary: 'px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600',
    secondary: 'px-4 py-2 bg-gray-500 text-white rounded',
  }

  return (
    <button className={styles[variant]} {...props}>
      {children}
    </button>
  )
}

/**
 * Search Portal Factory - Example of composable pattern
 *
 * Users can create their own factories or use this as inspiration
 */
export function createSearchPortal(
  name: string,
  urlTemplate: string,
  prefix?: string
) {
  return {
    type: 'portal' as const,
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name: `${name} Search`,
    ...(prefix && { prefixes: [prefix] }),
    render: (query: string, ctx: { onClose: () => void }) => {
      const [search, setSearch] = useState(
        query.replace(
          new RegExp(
            `^${prefix ? prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ''}\\s*`,
            ''
          ),
          ''
        )
      )

      const handleSearch = () => {
        const url = urlTemplate.replace('{query}', encodeURIComponent(search))
        console.log(`Demo: Would open ${url} in new tab`)
        ctx.onClose()
      }

      return (
        <PortalLayout title={`${name} Search`} icon="🔍">
          <Input
            value={search}
            onChange={setSearch}
            placeholder={`Search ${name}...`}
            autoFocus
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === 'Enter' && handleSearch()
            }
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch}>🔍 Search</Button>
            <Button variant="secondary" onClick={ctx.onClose}>
              Cancel
            </Button>
          </div>
        </PortalLayout>
      )
    },
  }
}
