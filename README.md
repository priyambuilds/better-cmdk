# Cmd-Pal-for-the-web

A free lightweight, high-performance, unstyled command search library, designed to be customizable with optional built-in features, built for React 19+ and TypeScript inspired by Raycast, and cmdk.

https://github.com/user-attachments/assets/9dd4098a-eeeb-4312-aa8f-89457d3d0690


## Features

- **Fast Search** - Fuzzy search with Fuse.js and command-score algorithms
- **Flexible Architecture** - Actions, portals, and nested categories
- **Built with Performance in mind** - Virtualization support for thousands of commands
- **Fully Customizable** - Style with Tailwind CSS or your preferred framework
- **Accessible** - Full keyboard navigation and screen reader support
- **Developer Friendly** - TypeScript, comprehensive API, and extensive documentation

## Setup

### 1. Render the Command Palette

In your React application:

```typescript
import { Command, CommandInput, CommandList, CommandItem } from 'cmd-pal-for-the-web'
import { commandPaletteConfig } from './config/commands'

function App() {
  const [isOpen, setIsOpen] = React.useState(false)

  // Toggle with Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {/* Your app content */}
      <button onClick={() => setIsOpen(true)}>
        Open Command Palette (Ctrl+K)
      </button>

      {/* Command Palette */}
      {isOpen && (
        <Command
          label="Command Palette"
          modal={true}
          className="h-[480px] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg shadow-2xl"
          config={{
            enableRecentCommands: true,
            loop: true,
            virtualization: false,
          }}
        >
          <AppContent onClose={() => setIsOpen(false)} />
        </Command>
      )}
    </>
  )
}

function AppContent({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = React.useState('')
  const [filteredCommands, setFilteredCommands] = React.useState([])

  // Filter commands based on search
  React.useEffect(() => {
    const filtered = commandPaletteConfig.commands.filter(cmd =>
      cmd.name.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredCommands(filtered)
  }, [query])

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="flex items-center p-4">
          <div className="relative flex-1">
            <svg className="absolute left-0 w-4 h-4 text-gray-400 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <CommandInput
              placeholder="Type a command or search..."
              autoFocus
              className="w-full pl-6 text-gray-900 placeholder-gray-500 bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Command List */}
      <div className="flex-1 overflow-y-auto">
        <CommandList className="py-2">
          {filteredCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              value={cmd.id}
              keywords={cmd.keywords || []}
              onSelect={() => {
                if (cmd.type === 'action') {
                  cmd.execute()
                  onClose()
                } else if (cmd.type === 'portal') {
                  // Handle portal navigation
                } else if (cmd.type === 'category') {
                  // Handle category navigation
                }
              }}
              className="flex items-center gap-4 px-4 py-3 text-sm cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center flex-1 gap-4">
                <span className="shrink-0 text-lg opacity-70">
                  {cmd.icon || '➡️'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-base leading-tight text-gray-900">
                    {cmd.name}
                  </div>
                  {cmd.description && (
                    <div className="text-sm leading-tight text-gray-500 truncate">
                      {cmd.description}
                    </div>
                  )}
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandList>
      </div>

      {/* Empty State */}
      {filteredCommands.length === 0 && (
        <div className="flex items-center justify-center py-8 text-gray-500">
          {query ? 'No commands found' : 'Start typing to search...'}
        </div>
      )}
    </>
  )
}
```

## Configuration Deep Dive

### Command Definition Structure

Everything users can define is contained in `src/config/commands.tsx`. The configuration object supports infinite nesting and complete customization.

#### Base Command Properties (All Types)

```typescript
interface BaseCommand {
  id: string // Unique identifier
  name: string // Display name
  description?: string // Optional description
  icon?: string // Emoji or icon (e.g., '🔧', '📧')
  keywords?: string[] // Additional search terms
  prefixes?: string[] // Keyboard shortcuts (e.g., ['!g', '!google'])
}
```

### 1. Actions - Immediate Execution

**Use Case**: Simple commands that execute immediately when selected.

```typescript
{
  type: 'action',
  id: 'theme-toggle',
  name: 'Toggle Theme',
  description: 'Switch between light and dark mode',
  icon: '�',
  keywords: ['theme', 'dark', 'light', 'mode', 'toggle'],
  prefixes: ['!theme'], // Multiple shortcuts supported
  execute: () => {
    // Any async/sync function
    document.documentElement.classList.toggle('dark')
  }
}
```

**Action-Specific Properties**:

- `execute: () => void | Promise<void>` - Function to run on selection

### 2. Portals - Interactive Interfaces

**Use Case**: Complex UIs requiring user interaction (forms, calculators, games, etc.)

```typescript
{
  type: 'portal',
  id: 'calculator',
  name: 'Calculator',
  description: 'Mathematical calculations and expressions',
  icon: '🔢',
  keywords: ['calculator', 'math', 'calculate', 'compute', 'numbers', 'equations'],
  prefixes: ['!calc', '!math'],
  showSearchInput: false, // Hide search input in portal (default: true)
  render: (query: string, context: PortalContext) => {
    // Return React element - full control over UI
    const [expression, setExpression] = React.useState(query || '')
    const [result, setResult] = React.useState('')

    const calculate = () => {
      try {
        const calculated = new Function('return (' + expression + ')')()
        setResult(String(calculated))
      } catch (error) {
        setResult('Error: ' + error.message)
      }
    }

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Calculator</h2>
        <input
          className="w-full p-3 border rounded"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter expression (e.g., (2 + 3) * 4 / 2)"
          onKeyPress={(e) => e.key === 'Enter' && calculate()}
        />
        <div className="text-center text-2xl font-bold p-4 bg-gray-100 rounded">
          {result || 'Result will appear here...'}
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={calculate}
          >
            = Calculate
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded"
            onClick={context.onClose}
          >
            Close
          </button>
        </div>
      </div>
    )
  }
}
```

**Portal-Specific Properties**:

- `render: (query: string, context: PortalContext) => React.ReactElement` - Render function
- `showSearchInput?: boolean` - Whether to show search input in portal

**PortalContext API**:

```typescript
interface PortalContext {
  onClose: () => void // Close the portal
  store?: any // Access to command store state
}
```

### 3. Categories - Nested Navigation

**Use Case**: Organize commands into hierarchical groups with unlimited nesting depth.

```typescript
{
  type: 'category',
  id: 'productivity-suite',
  name: 'Productivity Suite',
  description: 'Professional tools and workflows',
  icon: '⚡',
  keywords: ['work', 'productivity', 'business', 'office', 'professional'],
  children: [
    // Can contain actions, portals, or more categories
    {
      type: 'action',
      id: 'open-settings',
      name: 'Open Settings',
      description: 'Navigate to application settings',
      icon: '⚙️',
      keywords: ['settings', 'config', 'preferences', 'options'],
      execute: () => {
        window.location.href = '/settings'
      },
    },

    // Nested category (infinite depth)
    {
      type: 'category',
      id: 'writing-tools',
      name: 'Writing Suite',
      description: 'Document and content creation',
      icon: '✍️',
      keywords: ['writing', 'docs', 'content', 'author', 'create'],
      children: [
        {
          type: 'portal',
          id: 'quick-notes',
          name: 'Quick Notes',
          description: 'Jot down thoughts and ideas',
          icon: '📝',
          showSearchInput: false,
          render: (query, context) => {
            const [notes, setNotes] = React.useState(
              localStorage.getItem('quick-notes') || ''
            )

            const saveNotes = () => {
              localStorage.setItem('quick-notes', notes)
            }

            return (
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Quick Notes</h2>
                <textarea
                  className="w-full h-32 p-3 border rounded resize-none"
                  placeholder="Write your thoughts here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={saveNotes}
                  >
                    💾 Save Notes
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                    onClick={context.onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            )
          },
        },

        // Another nested category
        {
          type: 'category',
          id: 'publishing-platforms',
          name: 'Publishing Platforms',
          description: 'Share and publish content',
          icon: '🌐',
          keywords: ['publish', 'blog', 'content', 'share', 'online'],
          children: [
            {
              type: 'action',
              id: 'medium',
              name: 'Medium',
              description: 'Story publishing platform',
              icon: '📚',
              execute: () => {
                window.open('https://medium.com', '_blank')
              },
            }
          ]
        }
      ]
    }
  ]
}
```

**Category-Specific Properties**:

- `children: Command[]` - Array of nested commands (actions, portals, or categories)

### Advanced Configuration Patterns

#### Flat Configuration Structure

For easier management, use a flattened structure with groups:

```typescript
export const flatCommandPaletteConfig = {
  // All commands in flat arrays
  actions: [
    {
      type: 'action',
      id: 'theme-toggle',
      name: 'Toggle Theme',
      icon: '�',
      execute: () => document.documentElement.classList.toggle('dark')
    }
  ],

  portals: [
    {
      type: 'portal',
      id: 'calculator',
      name: 'Calculator',
      icon: '🔢',
      render: (query, context) => <CalculatorComponent />
    }
  ],

  categories: [
    {
      type: 'category',
      id: 'productivity',
      name: 'Productivity',
      icon: '⚡',
      children: [] // Flat structure - reference by ID
    }
  ],

  // Optional grouping for organization
  groups: {
    'productivity-actions': {
      name: 'Productivity Actions',
      icon: '⚡',
      description: 'Quick productivity shortcuts',
      commands: ['theme-toggle', 'copy-url', 'open-settings']
    }
  }
}
```

#### Helper Functions for Common Patterns

```typescript
// Search portal factory
function createSearchPortal(name: string, urlTemplate: string, prefix?: string) {
  return {
    type: 'portal' as const,
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name: `${name} Search`,
    icon: '🔍',
    ...(prefix && { prefixes: [prefix] }),
    render: (query: string, context: { onClose: () => void }) => {
      const [search, setSearch] = React.useState(
        query.replace(new RegExp(`^${prefix}\\s*`, ''), '')
      )

      const handleSearch = () => {
        const url = urlTemplate.replace('{query}', encodeURIComponent(search))
        window.open(url, '_blank') // Open in new tab/window
        context.onClose()
      }

      return (
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold">{name} Search</h2>
          <input
            className="w-full p-3 border rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${name}...`}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <div className="flex gap-2">
            <button
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={handleSearch}
            >
              Search
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded"
              onClick={context.onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }
  }
}

// Usage
const googleSearch = createSearchPortal('Google', 'https://google.com/search?q={query}', '!g')
const youtubeSearch = createSearchPortal('YouTube', 'https://youtube.com/results?q={query}', '!yt')
```

#### Dynamic Command Generation

```typescript
// Generate navigation commands from route data
function createNavigationCommands(
  routes: Array<{ path: string; title: string; description?: string }>
) {
  return routes.map(route => ({
    type: 'action' as const,
    id: `nav-${route.path.replace(/\//g, '-')}`,
    name: route.title,
    description: route.description || `Navigate to ${route.title}`,
    icon: '🧭',
    keywords: ['navigate', 'go', route.title.toLowerCase()],
    execute: () => {
      window.location.href = route.path
    },
  }))
}

// Generate commands from user preferences/settings
function createUserPreferenceCommands(
  preferences: Array<{ key: string; label: string; value: boolean }>
) {
  return preferences.map(pref => ({
    type: 'action' as const,
    id: `pref-${pref.key}`,
    name: `${pref.label}: ${pref.value ? 'On' : 'Off'}`,
    description: `Toggle ${pref.label.toLowerCase()}`,
    icon: pref.value ? '✅' : '❌',
    keywords: ['preference', 'setting', pref.label.toLowerCase()],
    execute: () => {
      // Update preference in your app's state management
      console.log(`Toggling ${pref.key} to ${!pref.value}`)
      // Your preference update logic here
    },
  }))
}

// Generate category from API data
function createFeatureCategory(
  features: Array<{ name: string; action: () => void; category: string }>
) {
  const categories = features.reduce(
    (acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = []
      }
      acc[feature.category].push({
        type: 'action' as const,
        id: `feature-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: feature.name,
        icon: '⚡',
        execute: feature.action,
      })
      return acc
    },
    {} as Record<string, Command[]>
  )

  return Object.entries(categories).map(([categoryName, commands]) => ({
    type: 'category' as const,
    id: `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
    name: categoryName,
    icon: '�',
    children: commands,
  }))
}
```

### Component-Level Configuration

Pass configuration to the `Command` component for global behavior:

```typescript
<Command
  config={{
    // Feature toggles
    enableRecentCommands: true,
    loop: true, // Arrow key wrapping

    // Search configuration
    defaultSearchLibrary: 'fuse', // 'fuse' or 'commandscore'
    fuseConfig: {
      threshold: 0.3,        // Search strictness (0.0-1.0)
      minScore: 0.1,         // Minimum score threshold
      maxResults: 50,        // Maximum results to return
      includeMatches: false, // Don't return match indices
      minMatchCharLength: 1, // Include single character matches
      shouldSort: true,      // Sort results by relevance
      findAllMatches: false, // Stop at first perfect match
      ignoreLocation: true,  // Search anywhere in strings
      enablePrefixBoosting: true, // Boost prefix matches
      enableCaching: true,   // Enable result caching
      debounceMs: 150,       // Debounce delay
    },

    // Performance optimization
    virtualization: false,
    virtualizationConfig: {
      itemHeight: 64,      // Height of each item
      overscan: 10,        // Extra items to render
      dynamicSizing: true, // Measure actual item heights
    },
  }}
>
  {/* Children */}
</Command>
```

### Complete Configuration Example

```typescript
export const commandPaletteConfig: UserCommandConfig = {
  commands: [
    // ============================================================================
    // SEARCH PORTALS - Quick access to search engines
    // ============================================================================
    createSearchPortal('Google', 'https://google.com/search?q={query}', '!g'),
    createSearchPortal('YouTube', 'https://youtube.com/results?q={query}', '!yt'),
    createSearchPortal('GitHub', 'https://github.com/search?q={query}', '!gh'),

    // ============================================================================
    // APPLICATION ACTIONS - App-specific functionality
    // ============================================================================
    {
      type: 'action',
      id: 'theme-toggle',
      name: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: '🌙',
      keywords: ['theme', 'dark', 'light', 'mode', 'toggle'],
      prefixes: ['!theme'],
      execute: () => {
        document.documentElement.classList.toggle('dark')
      }
    },

    {
      type: 'action',
      id: 'copy-url',
      name: 'Copy Current URL',
      description: 'Copy the current page URL to clipboard',
      icon: '📋',
      keywords: ['url', 'copy', 'clipboard', 'link', 'share'],
      execute: async () => {
        await navigator.clipboard.writeText(window.location.href)
        alert('URL copied!')
      }
    },

    {
      type: 'action',
      id: 'clear-cache',
      name: 'Clear Cache',
      description: 'Clear application cache and reload',
      icon: '🗑️',
      keywords: ['cache', 'clear', 'reset', 'reload', 'refresh'],
      execute: () => {
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
      }
    },

    // ============================================================================
    // CALCULATOR PORTAL - Interactive math tool
    // ============================================================================
    {
      type: 'portal',
      id: 'calculator',
      name: 'Calculator',
      description: 'Mathematical calculations and expressions',
      icon: '🔢',
      keywords: ['calculator', 'math', 'calculate', 'compute', 'numbers', 'equations'],
      prefixes: ['!calc', '!math'],
      showSearchInput: false,
      render: (query, context) => {
        const [expression, setExpression] = React.useState(query || '')
        const [result, setResult] = React.useState('')

        const calculate = () => {
          try {
            const calculated = new Function('return (' + expression + ')')()
            setResult(String(calculated))
          } catch (error) {
            setResult('Error: ' + error.message)
          }
        }

        return (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Calculator</h2>
            <input
              className="w-full p-3 border rounded"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Enter expression (e.g., (2 + 3) * 4 / 2)"
              onKeyPress={(e) => e.key === 'Enter' && calculate()}
            />
            <div className="text-center text-2xl font-bold p-4 bg-gray-100 rounded">
              {result || 'Result will appear here...'}
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={calculate}
              >
                = Calculate
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded"
                onClick={() => setExpression('')}
              >
                Clear
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded"
                onClick={context.onClose}
              >
                Close
              </button>
            </div>
          </div>
        )
      }
    },

    // ============================================================================
    // BROWSER ACTIONS - Immediate execution commands
    // ============================================================================
    {
      type: 'action',
      id: 'export-data',
      name: 'Export Data',
      description: 'Download application data as JSON',
      icon: '📥',
      keywords: ['export', 'download', 'data', 'json', 'backup'],
      prefixes: ['!export'],
      execute: () => {
        const data = { timestamp: new Date().toISOString(), version: '1.0' }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'export.json'
        a.click()
        URL.revokeObjectURL(url)
      }
    },

    {
      type: 'action',
      id: 'reset-settings',
      name: 'Reset Settings',
      description: 'Reset all settings to defaults',
      icon: '🔄',
      keywords: ['reset', 'settings', 'default', 'clear', 'restore'],
      prefixes: ['!reset'],
      execute: () => {
        if (confirm('Are you sure you want to reset all settings?')) {
          localStorage.clear()
          sessionStorage.clear()
          window.location.reload()
        }
      }
    },

    {
      type: 'action',
      id: 'go-fullscreen',
      name: 'Toggle Fullscreen',
      description: 'Enter or exit fullscreen mode',
      icon: '�',
      keywords: ['fullscreen', 'screen', 'display', 'mode', 'toggle'],
      prefixes: ['!fs'],
      execute: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    },

    // ============================================================================
    // DEEP NESTED CATEGORIES - Infinite depth navigation
    // ============================================================================
    {
      type: 'category',
      id: 'productivity-suite',
      name: 'Productivity Suite',
      description: 'Professional tools and workflows',
      icon: '⚡',
      keywords: ['work', 'productivity', 'business', 'office', 'professional'],
      children: [
        {
          type: 'category',
          id: 'writing-tools',
          name: 'Writing Suite',
          description: 'Document and content creation',
          icon: '✍️',
          keywords: ['writing', 'docs', 'content', 'author', 'create'],
          children: [
            {
              type: 'action',
              id: 'create-document',
              name: 'Create Document',
              description: 'Start a new document',
              icon: '📄',
              keywords: ['document', 'new', 'create', 'write', 'start'],
              execute: () => {
                window.location.href = '/documents/new'
              }
            },

            {
              type: 'category',
              id: 'publishing-platforms',
              name: 'Publishing Platforms',
              description: 'Share and publish content',
              icon: '🌐',
              keywords: ['publish', 'blog', 'content', 'share', 'online'],
              children: [
                {
                  type: 'action',
                  id: 'publish-blog',
                  name: 'Publish Blog Post',
                  description: 'Create and publish a new blog post',
                  icon: '📚',
                  keywords: ['blog', 'publish', 'write', 'post', 'content'],
                  execute: () => {
                    window.location.href = '/blog/new'
                  }
                }
              ]
            }
          ]
        },

        {
          type: 'category',
          id: 'communication-tools',
          name: 'Communication',
          description: 'Team messaging and email tools',
          icon: '💬',
          keywords: ['chat', 'email', 'communication', 'team', 'messages'],
          children: [
            {
              type: 'action',
              id: 'send-email',
              name: 'Send Email',
              description: 'Compose and send a new email',
              icon: '📧',
              keywords: ['email', 'mail', 'compose', 'send', 'message'],
              execute: () => {
                window.location.href = '/email/compose'
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Component API

### Command

The root component that manages state and provides context.

```typescript
interface CommandProps {
  label: string // Accessible label
  config?: CommandConfig // Configuration options
  value?: string // Controlled search value
  onValueChange?: (value: string) => void
  shouldFilter?: boolean // Enable/disable filtering
  loop?: boolean // Arrow key wrapping
  enableRecentCommands?: boolean
  className?: string
  children?: React.ReactNode
  virtualizationConfig?: VirtualizationConfig
  modal?: boolean // Render as modal dialog
}
```

### CommandInput

Search input component with accessibility features.

```typescript
interface CommandInputProps {
  placeholder?: string
  autoFocus?: boolean
  className?: string
  children?: React.ReactNode // Custom input rendering
}
```

### CommandList

Container for command items with keyboard navigation.

```typescript
interface CommandListProps {
  children?: React.ReactNode
  className?: string
  commands?: CommandItemData[] // Pre-filtered commands
  renderItem?: (command: CommandItemData) => React.ReactNode
  virtualizationConfig?: VirtualizationConfig
}
```

### CommandItem

Individual selectable command item.

```typescript
interface CommandItemProps {
  id?: string
  value: string // Unique identifier
  keywords?: string[] // Additional search terms
  disabled?: boolean
  onSelect?: (value: string) => void
  skipScoring?: boolean
  className?: string
  children?: React.ReactNode
  isActive?: boolean
}
```

### CommandEmpty

Empty state component when no results are found.

```typescript
interface CommandEmptyProps {
  children?: React.ReactNode
  className?: string
}
```

## Search & Filtering

### Search Algorithms

Choose between two fuzzy search algorithms:

#### Fuse.js (Recommended)

```typescript
config: {
  defaultSearchLibrary: 'fuse',
  fuseConfig: {
    threshold: 0.3,        // Search strictness
    location: 0,           // Search from start of string
    distance: 100,         // Character distance for matches
    ignoreLocation: false, // Consider position in scoring
    minMatchCharLength: 1, // Minimum match length
    shouldSort: true,      // Sort by relevance
    findAllMatches: false, // Stop at first match
    includeMatches: false, // Include match metadata
  }
}
```

#### Command Score

```typescript
config: {
  defaultSearchLibrary: 'commandscore'
}
```

### Custom Filtering

Implement custom search logic:

```typescript
<Command shouldFilter={false}>
  <CommandList
    commands={customFilteredCommands}
    renderItem={(cmd) => <CommandItem {...cmd} />}
  />
</Command>
```

## Performance & Virtualization

For large command lists, enable virtualization:

```typescript
<Command
  config={{
    virtualization: true,
    virtualizationConfig: {
      itemHeight: 64,      // Height of each item
      overscan: 10,        // Extra items to render
      dynamicSizing: true, // Measure actual item heights
    }
  }}
>
  {/* Children */}
</Command>
```

## Styling & Theming

### CSS Classes

All components forward className props and use data attributes:

```css
/* Command root */
[data-cmdk-root] {
  /* Styles */
}

/* Input */
[data-cmdk-input] {
  /* Styles */
}

/* List container */
[data-cmdk-list] {
  /* Styles */
}

/* Individual items */
[data-cmdk-item] {
  /* Styles */
}

[data-cmdk-item][data-selected] {
  /* Selected state */
}

[data-cmdk-item][data-disabled] {
  /* Disabled state */
}

/* Groups */
[data-cmdk-group] {
  /* Group styles */
}

[data-cmdk-group-heading] {
  /* Group heading */
}

/* Empty state */
[data-cmdk-empty] {
  /* Empty state */
}
```

### Dark Mode

The library supports dark mode through CSS variables:

```css
[data-cmdk-root] {
  --cmdk-background: #ffffff;
  --cmdk-foreground: #000000;
  --cmdk-muted: #f1f5f9;
  --cmdk-accent: #e2e8f0;
  --cmdk-border: #e2e8f0;
}

.dark [data-cmdk-root] {
  --cmdk-background: #0f172a;
  --cmdk-foreground: #f8fafc;
  --cmdk-muted: #1e293b;
  --cmdk-accent: #334155;
  --cmdk-border: #334155;
}
```

## Advanced Usage

### Custom Hooks

#### useCommandState

Access command palette state:

```typescript
import { useCommandState } from 'cmd-pal-for-the-web'

function MyComponent() {
  const { query, activeId, view } = useCommandState()

  return (
    <div>
      Current query: {query}
      Active item: {activeId}
      Current view: {view.type}
    </div>
  )
}
```

#### useSearch

Custom search implementation:

```typescript
import { useSearch } from 'cmd-pal-for-the-web'

function CustomSearchComponent() {
  const { query, filteredCommands } = useSearch(
    commandPaletteConfig.commands,
    undefined,
    { algorithm: 'fuse', maxResults: 20 }
  )

  return (
    <CommandList
      commands={filteredCommands.map(cmd => ({
        id: cmd.id,
        name: cmd.name,
        icon: cmd.icon,
        description: cmd.description,
        keywords: cmd.keywords,
        onSelect: () => handleCommandSelect(cmd.id)
      }))}
      renderItem={(cmd) => <CommandItem {...cmd} />}
    />
  )
}
```

### Portal Context

Access portal utilities:

```typescript
render: (query: string, context: PortalContext) => {
  const { onClose, store } = context

  // Access store state
  const state = store.getState()

  return (
    <div>
      <button onClick={onClose}>Close Portal</button>
      <div>Current query: {query}</div>
    </div>
  )
}
```

### Keyboard Shortcuts

Define prefix shortcuts for quick access:

```typescript
{
  type: 'action',
  id: 'open-dashboard',
  name: 'Open Dashboard',
  description: 'Navigate to the main dashboard',
  prefixes: ['!d', '!dashboard'], // Multiple prefixes
  execute: () => {
    window.location.href = '/dashboard'
  }
}
```

### Recent Commands

Automatically track and display recently used commands:

```typescript
<Command
  config={{
    enableRecentCommands: true
  }}
>
  {/* Commands */}
</Command>
```

## Examples

### Calculator Portal

```typescript
{
  type: 'portal',
  id: 'calculator',
  name: 'Calculator',
  icon: '🔢',
  render: (query, context) => {
    const [expression, setExpression] = React.useState(query || '')
    const [result, setResult] = React.useState('')

    const calculate = () => {
      try {
        const calculated = new Function('return (' + expression + ')')()
        setResult(String(calculated))
      } catch (error) {
        setResult('Error')
      }
    }

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Calculator</h2>
        <input
          className="w-full p-3 border rounded"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="2 + 3 * 4"
          onKeyPress={(e) => e.key === 'Enter' && calculate()}
        />
        <div className="text-center text-2xl font-bold p-4 bg-gray-100 rounded">
          {result || 'Result'}
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={calculate}
          >
            Calculate
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded"
            onClick={context.onClose}
          >
            Close
          </button>
        </div>
      </div>
    )
  }
}
```

### Search Portal Factory

```typescript
function createSearchPortal(name: string, urlTemplate: string, prefix?: string) {
  return {
    type: 'portal' as const,
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name: `${name} Search`,
    icon: '🔍',
    ...(prefix && { prefixes: [prefix] }),
    render: (query: string, context: { onClose: () => void }) => {
      const [search, setSearch] = React.useState(
        query.replace(new RegExp(`^${prefix}\\s*`, ''), '')
      )

      const handleSearch = () => {
        const url = urlTemplate.replace('{query}', encodeURIComponent(search))
        window.open(url, '_blank') // Open in new tab/window
        context.onClose()
      }

      return (
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold">{name} Search</h2>
          <input
            className="w-full p-3 border rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${name}...`}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <div className="flex gap-2">
            <button
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={handleSearch}
            >
              Search
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded"
              onClick={context.onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }
  }
}

// Usage
const googleSearch = createSearchPortal('Google', 'https://google.com/search?q={query}', '!g')
```

## Development

### Building

```bash
# Development
npm run dev

# Production build
npm run build

# Firefox build
npm run build:firefox

# Analyze bundle size
npm run build:analyze
```

### Testing

```bash
# Type checking
npm run compile

# Linting
npm run lint

# Formatting
npm run format
```

### Project Structure

```
src/
├── components/          # React components
│   ├── Command.tsx     # Root command palette
│   ├── CommandInput.tsx# Search input
│   ├── CommandList.tsx # Item list container
│   ├── CommandItem.tsx # Individual items
│   └── ...
├── config/             # User configuration
│   └── commands.tsx    # Command definitions
├── lib/                # Utilities and hooks
│   ├── search/         # Search algorithms
│   ├── virtualization/ # Performance optimization
│   └── ...
├── types/              # TypeScript definitions
└── styles/             # CSS styles
```

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/cmd-pal-for-the-web.git`
3. Install dependencies: `npm install`
4. Start development: `npm run dev`
5. Make your changes
6. Run tests: `npm run compile && npm run lint`
7. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [cmdk](https://github.com/pacocoursey/cmdk) by Paco Coursey
- Search powered by [Fuse.js](https://fusejs.io/) and [command-score](https://github.com/commandscore/command-score)
- Virtualization by [TanStack Virtual](https://tanstack.com/virtual/)
- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
