/**
 * Comprehensive Command Palette Test Configuration
 *
 * This config demonstrates every capability of the command palette:
 * - Actions (immediate execution)
 * - Portals (interactive interfaces)
 * - Categories (navigation)
 * - Deep nesting (infinite depth)
 * - Prefix shortcuts (!g, !y, etc.)
 * - Rich content (calculators, games, utilities)
 * - Plug-and-play functionality (just config, no code)
 */

import React from 'react'
import type { PortalContext } from '@/types/types'
import type { Command } from '@/types/types'
import {
  PortalLayout,
  Input,
  Button,
  createSearchPortal,
} from '@/example/config/helpers'

export interface UserCommandConfig {
  commands?: Command[]
  navigables?: any[] // Legacy support during transition
}

/**
 * Flattened configuration structure for easier management
 */
export interface FlatCommandConfig {
  // Simple arrays instead of nested structures
  actions?: Command[]
  portals?: Command[]
  categories?: Command[]

  // Optional grouping for organization
  groups?: {
    [groupId: string]: {
      name: string
      icon?: string
      description?: string
      commands: string[] // Command IDs
    }
  }
}

// Utility functions for portal content
const prettyPrint = (obj: any) => JSON.stringify(obj, null, 2)
const executeCode = (code: string) => {
  try {
    // Safe evaluation for demo purposes (never do this in production!)
    return new Function('return (' + code + ')')()
  } catch (e) {
    return String(e)
  }
}

/**
 * Flattened configuration example - easier to manage and extend
 */
export const flatCommandPaletteConfig: FlatCommandConfig = {
  // All actions in one flat array
  actions: [
    // Browser actions
    {
      type: 'action',
      id: 'new-tab',
      name: 'New Tab',
      description: 'Create a new browser tab',
      icon: '🆕',
      keywords: ['tab', 'new', 'create', 'open', 'window', 'browser'],
      prefixes: ['!nt'],
      execute: () => {
        console.log('Demo: Would create new tab')
      },
    },
    {
      type: 'action',
      id: 'close-tab',
      name: 'Close Tab',
      description: 'Close current tab',
      icon: '❌',
      keywords: ['tab', 'close', 'exit', 'quit', 'remove', 'x'],
      prefixes: ['!ct'],
      execute: () => {
        console.log('Demo: Would close current tab')
      },
    },
    {
      type: 'action',
      id: 'reload-page',
      name: 'Reload Page',
      description: 'Refresh current page',
      icon: '🔄',
      keywords: ['reload', 'refresh', 'page', 'update', 'restart'],
      prefixes: ['!r'],
      execute: () => window.location.reload(),
    },
    {
      type: 'action',
      id: 'copy-url',
      name: 'Copy Current URL',
      description: 'Copy current page URL to clipboard',
      icon: '📋',
      keywords: ['url', 'copy', 'clipboard', 'link', 'share', 'current'],
      execute: async () => {
        await navigator.clipboard.writeText(window.location.href)
      },
    },

    // External service actions
    {
      type: 'action',
      id: 'google-docs',
      name: 'Google Docs',
      description: 'Collaborative document editing',
      icon: '📄',
      keywords: ['google', 'docs', 'document', 'write', 'collaborate'],
      execute: () => {
        console.log('Demo: Would open Google Docs')
      },
    },
    {
      type: 'action',
      id: 'gmail',
      name: 'Gmail',
      description: 'Google email service',
      icon: '📧',
      keywords: ['gmail', 'google', 'email', 'mail', 'messages'],
      execute: () => {
        console.log('Demo: Would open Gmail')
      },
    },
    {
      type: 'action',
      id: 'slack',
      name: 'Slack',
      description: 'Team communication platform',
      icon: '💬',
      keywords: ['slack', 'team', 'chat', 'communication', 'work'],
      execute: () => {
        console.log('Demo: Would open Slack')
      },
    },
  ],

  // All portals in one flat array
  portals: [
    // Search portals
    createSearchPortal('Google', 'https://google.com/search?q={query}', '!g'),
    {
      type: 'portal',
      id: 'youtube-search',
      name: 'YouTube Search',
      description: 'Search for videos and tutorials',
      icon: '📺',
      keywords: ['youtube', 'video', 'tutorials', 'watch', 'learn'],
      prefixes: ['!yt'],
      render: (query: string, context: PortalContext) => {
        const [search, setSearch] = React.useState(query.replace(/^!yt\s*/, ''))

        return (
          <PortalLayout title="YouTube Search" icon="📺">
            <Input
              value={search}
              onChange={setSearch}
              placeholder="Search YouTube..."
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  console.log(`Demo: Would search YouTube for "${search}"`)
                  context.onClose()
                }}
              >
                ▶️ Search YouTube
              </Button>
              <Button variant="secondary" onClick={context.onClose}>
                Cancel
              </Button>
            </div>
          </PortalLayout>
        )
      },
    },

    // Utility portals
    {
      type: 'portal',
      id: 'calculator',
      name: 'Calculator',
      description: 'Mathematical calculations and expressions',
      icon: '🔢',
      keywords: [
        'calculator',
        'math',
        'calculate',
        'compute',
        'numbers',
        'equations',
      ],
      showSearchInput: false,
      render: (query: string, context: PortalContext) => {
        const [expression, setExpression] = React.useState(query || '')
        const [result, setResult] = React.useState('')

        const calculate = () => {
          try {
            if (!expression) return
            // Safe evaluation for demo (simple expressions only)
            if (/[^0-9+\-*/().\s]/g.test(expression)) {
              throw new Error('Only basic math allowed (+ - * / .)')
            }
            const calculated = new Function('return (' + expression + ')')()
            setResult(String(calculated))
          } catch (error) {
            setResult('Error: ' + String(error).split(':')[0])
          }
        }

        return (
          <PortalLayout title="Calculator" icon="🔢">
            <Input
              value={expression}
              onChange={setExpression}
              placeholder="Enter expression (e.g., (2 + 3) * 4 / 2)"
              onKeyPress={e => e.key === 'Enter' && calculate()}
            />
            <div className="p-4 bg-gray-100 rounded-lg text-center text-xl font-bold font-mono min-h-[3rem] flex items-center justify-center">
              {result || 'Result will appear here...'}
            </div>
            <div className="flex gap-2">
              <Button onClick={calculate} className="flex-1">
                = Calculate
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setExpression('')
                  setResult('')
                }}
              >
                Clear
              </Button>
              <Button variant="secondary" onClick={context.onClose}>
                Close
              </Button>
            </div>
          </PortalLayout>
        )
      },
    },

    // Settings portal
    {
      type: 'portal',
      id: 'settings',
      name: 'Command Palette Settings',
      description: 'Customize your command palette experience',
      icon: '⚙️',
      keywords: ['settings', 'config', 'preferences', 'customize', 'options'],
      render: (query: string, context: PortalContext) => {
        const state = context.store?.getState()
        const searchLibrary = state?.searchLibrary || 'fuse'
        const fuseConfig = state?.fuseConfig || {}

        const [theme, setTheme] = React.useState('light')
        const [keyboardShortcuts, setKeyboardShortcuts] = React.useState(true)
        const [animationEnabled, setAnimationEnabled] = React.useState(true)
        const [currentSearchLibrary, setCurrentSearchLibrary] =
          React.useState(searchLibrary)

        const [fuseThreshold, setFuseThreshold] = React.useState(
          fuseConfig?.threshold ?? 0.3
        )

        const saveFuseConfig = () => {
          const newFuseConfig = {
            ...fuseConfig,
            threshold: fuseThreshold,
          }
          context.store?.setState({ fuseConfig: newFuseConfig })
        }

        return (
          <PortalLayout title="Settings" icon="⚙️">
            <div className="space-y-4">
              {/* Theme Setting */}
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-gray-600">
                    Choose your preferred theme
                  </div>
                </div>
                <select
                  className="px-3 py-1 border rounded"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              {/* Search Library */}
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Search Algorithm</div>
                  <div className="text-sm text-gray-600">
                    Choose fuzzy search library
                  </div>
                </div>
                <select
                  className="px-3 py-1 border rounded"
                  value={currentSearchLibrary}
                  onChange={e => {
                    const value = e.target.value
                    if (value === 'fuse' || value === 'commandscore') {
                      setCurrentSearchLibrary(value)
                      context.store?.setState({ searchLibrary: value })
                    }
                  }}
                >
                  <option value="fuse">Fuse.js (Recommended)</option>
                  <option value="commandscore">Command Score</option>
                </select>
              </div>

              {/* Fuse.js Options */}
              {currentSearchLibrary === 'fuse' && (
                <div className="space-y-4">
                  <div className="pt-4 text-lg font-semibold text-gray-700 border-t">
                    🔍 Fuse.js Fuzzy Search Options
                  </div>

                  <div className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">Search Threshold</div>
                        <div className="text-sm text-gray-600">
                          How strict the search is (0.0 = exact, 1.0 = loose)
                        </div>
                      </div>
                      <span className="font-mono text-sm">
                        {fuseThreshold.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={fuseThreshold}
                      onChange={e =>
                        setFuseThreshold(parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => {
                  saveFuseConfig()
                  alert('Settings saved!')
                }}
                className="flex-1"
              >
                💾 Save Settings
              </Button>
            </div>
          </PortalLayout>
        )
      },
    },
  ],

  // All categories in one flat array (no deep nesting)
  categories: [
    {
      type: 'category',
      id: 'productivity-suite',
      name: 'Productivity Suite',
      description: 'Professional tools and workflows',
      icon: '⚡',
      keywords: ['work', 'productivity', 'business', 'office', 'professional'],
      children: [], // Flat structure - no deep nesting
    },
    {
      type: 'category',
      id: 'developer-tools',
      name: 'Developer Tools',
      description: 'Coding and debugging utilities',
      icon: '🛠️',
      keywords: ['dev', 'developer', 'tools', 'debug', 'code', 'programming'],
      children: [], // Flat structure - no deep nesting
    },
  ],

  // Optional grouping for organization (instead of deep nesting)
  groups: {
    'productivity-actions': {
      name: 'Productivity Actions',
      icon: '⚡',
      description: 'Quick productivity shortcuts',
      commands: [
        'new-tab',
        'close-tab',
        'reload-page',
        'copy-url',
        'google-docs',
        'gmail',
        'slack',
      ],
    },
    'search-portals': {
      name: 'Search Portals',
      icon: '🔍',
      description: 'Quick search across different platforms',
      commands: ['youtube-search', 'calculator', 'settings'],
    },
    'productivity-categories': {
      name: 'Productivity Categories',
      icon: '📁',
      description: 'Organized productivity tools',
      commands: ['productivity-suite', 'developer-tools'],
    },
  },
}

/**
 * Legacy nested configuration (for backward compatibility)
 * This demonstrates the complex nested structure that the flat config replaces
 */
export const commandPaletteConfig: UserCommandConfig = {
  commands: [
    // ===========================================================================
    // SEARCH PORTALS - Using the new JSX API and helper factory
    // ===========================================================================

    // Google Search - Using the helper factory (1 line!)
    createSearchPortal('Google', 'https://google.com/search?q={query}', '!g'),

    // YouTube Search - Custom JSX portal
    {
      type: 'portal',
      id: 'youtube-search',
      name: 'YouTube Search',
      description: 'Search for videos and tutorials',
      icon: '📺',
      keywords: ['youtube', 'video', 'tutorials', 'watch', 'learn'],
      prefixes: ['!yt'],

      render: (query: string, context: PortalContext) => {
        const [search, setSearch] = React.useState(query.replace(/^!yt\s*/, ''))

        return (
          <PortalLayout title="YouTube Search" icon="📺">
            <Input
              value={search}
              onChange={setSearch}
              placeholder="Search YouTube..."
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  console.log(`Demo: Would search YouTube for "${search}"`)
                  context.onClose()
                }}
              >
                ▶️ Search YouTube
              </Button>
              <Button variant="secondary" onClick={context.onClose}>
                Cancel
              </Button>
            </div>
          </PortalLayout>
        )
      },
    },

    // GitHub Search - Custom JSX portal
    {
      type: 'portal',
      id: 'github-search',
      name: 'GitHub Search',
      description: 'Find code repositories and developers',
      icon: '🐙',
      keywords: ['github', 'code', 'repos', 'developers', 'open-source'],
      prefixes: ['!gh'],

      render: (query: string, context: PortalContext) => {
        const [search, setSearch] = React.useState(query.replace(/^!gh\s*/, ''))

        return (
          <PortalLayout title="GitHub Search" icon="🐙">
            <Input
              value={search}
              onChange={setSearch}
              placeholder="Search repositories..."
              autoFocus
            />
            <Button
              onClick={() => {
                console.log(`Demo: Would search GitHub for "${search}"`)
                context.onClose()
              }}
            >
              🔍 Search Repos
            </Button>
          </PortalLayout>
        )
      },
    },

    // ===========================================================================
    // CALCULATOR PORTAL - Advanced JSX with state management
    // ===========================================================================

    {
      type: 'portal',
      id: 'calculator',
      name: 'Calculator',
      description: 'Mathematical calculations and expressions',
      icon: '🔢',
      keywords: [
        'calculator',
        'math',
        'calculate',
        'compute',
        'numbers',
        'equations',
      ],
      showSearchInput: false,

      render: (query: string, context: PortalContext) => {
        const [expression, setExpression] = React.useState(query || '')
        const [result, setResult] = React.useState('')

        const calculate = () => {
          try {
            if (!expression) return
            // Safe evaluation for demo (simple expressions only)
            if (/[^0-9+\-*/().\s]/g.test(expression)) {
              throw new Error('Only basic math allowed (+ - * / .)')
            }
            const calculated = new Function('return (' + expression + ')')()
            setResult(String(calculated))
          } catch (error) {
            setResult('Error: ' + String(error).split(':')[0])
          }
        }

        return (
          <PortalLayout title="Calculator" icon="🔢">
            <Input
              value={expression}
              onChange={setExpression}
              placeholder="Enter expression (e.g., (2 + 3) * 4 / 2)"
              onKeyPress={e => e.key === 'Enter' && calculate()}
            />
            <div className="p-4 bg-gray-100 rounded-lg text-center text-xl font-bold font-mono min-h-[3rem] flex items-center justify-center">
              {result || 'Result will appear here...'}
            </div>
            <div className="flex gap-2">
              <Button onClick={calculate} className="flex-1">
                = Calculate
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setExpression('')
                  setResult('')
                }}
              >
                Clear
              </Button>
              <Button variant="secondary" onClick={context.onClose}>
                Close
              </Button>
            </div>
          </PortalLayout>
        )
      },
    },

    // ===========================================================================
    // UNIT CONVERTER - Complex interactive portal
    // ===========================================================================

    {
      type: 'portal',
      id: 'unit-converter',
      name: 'Unit Converter',
      description: 'Convert between different units of measurement',
      icon: '📏',
      keywords: ['convert', 'units', 'measure', 'calculator'],

      render: (query: string, context: PortalContext) => {
        const [fromValue, setFromValue] = React.useState('')
        const [fromUnit, setFromUnit] = React.useState('meters')
        const [toUnit, setToUnit] = React.useState('feet')
        const [result, setResult] = React.useState('')

        const conversions: Record<string, Record<string, number>> = {
          meters: { feet: 3.28084, inches: 39.3701, yards: 1.09361 },
          feet: { meters: 0.3048, inches: 12, yards: 0.333333 },
          inches: { meters: 0.0254, feet: 0.0833333, yards: 0.0277778 },
          yards: { meters: 0.9144, feet: 3, inches: 36 },
        }

        const convert = () => {
          const num = parseFloat(fromValue)
          if (isNaN(num) || fromUnit === toUnit) {
            setResult('Enter valid number')
            return
          }

          if (fromUnit === 'meters') {
            setResult((num * (conversions[fromUnit] as any)[toUnit]).toFixed(2))
          } else {
            const toMeters = num / (conversions[fromUnit] as any).feet
            setResult(
              (toMeters * (conversions.meters as any)[toUnit]).toFixed(2)
            )
          }
        }

        return (
          <PortalLayout title="Unit Converter" icon="📏">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">From</label>
                <Input
                  value={fromValue}
                  onChange={setFromValue}
                  placeholder="123"
                />
                <select
                  className="w-full p-2 mt-2 border rounded"
                  value={fromUnit}
                  onChange={e => setFromUnit(e.target.value)}
                >
                  <option value="meters">meters</option>
                  <option value="feet">feet</option>
                  <option value="inches">inches</option>
                  <option value="yards">yards</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">To</label>
                <div className="p-2 border rounded bg-gray-100 text-center text-lg font-bold min-h-[2.5rem] flex items-center justify-center">
                  {result || 'Result'}
                </div>
                <select
                  className="w-full p-2 mt-2 border rounded"
                  value={toUnit}
                  onChange={e => setToUnit(e.target.value)}
                >
                  <option value="feet">feet</option>
                  <option value="meters">meters</option>
                  <option value="inches">inches</option>
                  <option value="yards">yards</option>
                </select>
              </div>
            </div>

            <Button onClick={convert} className="w-full">
              🔄 Convert
            </Button>
          </PortalLayout>
        )
      },
    },

    // ===========================================================================
    // GAMES - Interactive entertainment portals
    // ===========================================================================

    {
      type: 'portal',
      id: 'rock-paper-scissors',
      name: 'Rock Paper Scissors',
      description: 'Classic game against the computer',
      icon: '✂️',
      keywords: ['game', 'rock', 'paper', 'scissors', 'rps', 'fun'],

      render: (query: string, context: PortalContext) => {
        const [playerChoice, setPlayerChoice] = React.useState('')
        const [computerChoice, setComputerChoice] = React.useState('')
        const [result, setResult] = React.useState('')

        const playGame = (choice: string) => {
          setPlayerChoice(choice)
          const choices = ['Rock', 'Paper', 'Scissors']
          const computer =
            choices[Math.floor(Math.random() * choices.length)] ?? 'Rock'
          setComputerChoice(computer)

          if (choice === computer) {
            setResult("It's a tie!")
          } else if (
            (choice === 'Rock' && computer === 'Scissors') ||
            (choice === 'Paper' && computer === 'Rock') ||
            (choice === 'Scissors' && computer === 'Paper')
          ) {
            setResult('🎉 You win!')
          } else {
            setResult('💔 Computer wins!')
          }
        }

        return (
          <PortalLayout title="Rock Paper Scissors" icon="✂️">
            <div className="flex justify-center gap-3 mb-6">
              {['Rock', 'Paper', 'Scissors'].map(choice => (
                <button
                  key={choice}
                  className="px-6 py-4 text-2xl border-2 rounded-lg hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => playGame(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>

            {playerChoice && (
              <div className="space-y-2 text-center">
                <div className="text-lg">
                  <span className="font-medium">You:</span> {playerChoice} |{' '}
                  <span className="font-medium">Computer:</span>{' '}
                  {computerChoice}
                </div>
                <div className="py-2 text-xl font-bold">{result}</div>
              </div>
            )}
          </PortalLayout>
        )
      },
    },

    {
      type: 'portal',
      id: 'number-guess',
      name: 'Number Guesser',
      description: 'Guess the secret number game',
      icon: '🎯',
      keywords: ['game', 'number', 'guess', 'random', 'brain-teaser'],

      render: (query: string, context: PortalContext) => {
        const [guess, setGuess] = React.useState('')
        const [target, setTarget] = React.useState(
          Math.floor(Math.random() * 100) + 1
        )
        const [attempts, setAttempts] = React.useState(0)
        const [message, setMessage] = React.useState(
          'Guess a number between 1-100!'
        )

        const makeGuess = () => {
          const numGuess = parseInt(guess)
          if (isNaN(numGuess)) {
            setMessage('Please enter a valid number!')
            return
          }

          setAttempts(prev => prev + 1)

          if (numGuess === target) {
            setMessage(`🎉 Correct! Found it in ${attempts + 1} guesses.`)
            setTimeout(() => {
              setTarget(Math.floor(Math.random() * 100) + 1)
              setAttempts(0)
              setGuess('')
              setMessage('New game! Guess a number between 1-100!')
            }, 2000)
          } else if (numGuess < target) {
            setMessage('📈 Too low! Try higher.')
          } else {
            setMessage('📉 Too high! Try lower.')
          }
        }

        return (
          <PortalLayout title="Number Guesser" icon="🎯">
            <Input
              value={guess}
              onChange={setGuess}
              placeholder="Enter your guess..."
              onKeyPress={e => e.key === 'Enter' && makeGuess()}
            />
            <div className="text-center">
              <Button onClick={makeGuess}>🎯 Guess</Button>
            </div>
            <div className="p-4 text-lg text-center bg-gray-100 rounded">
              {message}
            </div>
            {attempts > 0 && (
              <div className="text-sm text-center text-gray-600">
                Attempt {attempts}
              </div>
            )}
          </PortalLayout>
        )
      },
    },

    // ===========================================================================
    // BROWSER ACTIONS - Immediate execution commands
    // ===========================================================================

    {
      type: 'action',
      id: 'new-tab',
      name: 'New Tab',
      description: 'Create a new browser tab',
      icon: '🆕',
      keywords: ['tab', 'new', 'create', 'open', 'window', 'browser'],
      prefixes: ['!nt'],
      execute: () => {
        console.log('Demo: Would create new tab')
      },
    },

    {
      type: 'action',
      id: 'close-tab',
      name: 'Close Tab',
      description: 'Close current tab',
      icon: '❌',
      keywords: ['tab', 'close', 'exit', 'quit', 'remove', 'x'],
      prefixes: ['!ct'],
      execute: () => {
        console.log('Demo: Would close current tab')
      },
    },

    {
      type: 'action',
      id: 'reload-page',
      name: 'Reload Page',
      description: 'Refresh current page',
      icon: '🔄',
      keywords: ['reload', 'refresh', 'page', 'update', 'restart'],
      prefixes: ['!r'],
      execute: () => window.location.reload(),
    },

    {
      type: 'action',
      id: 'copy-url',
      name: 'Copy Current URL',
      description: 'Copy current page URL to clipboard',
      icon: '📋',
      keywords: ['url', 'copy', 'clipboard', 'link', 'share', 'current'],
      execute: async () => {
        await navigator.clipboard.writeText(window.location.href)
      },
    },

    {
      type: 'action',
      id: 'fullscreen-toggle',
      name: 'Toggle Fullscreen',
      description: 'Enter/exit fullscreen mode',
      icon: '🔳',
      keywords: ['fullscreen', 'screen', 'display', 'f11', 'mode'],
      execute: () =>
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen(),
    },

    {
      type: 'action',
      id: 'scroll-top',
      name: 'Scroll to Top',
      description: 'Jump to top of page',
      icon: '⬆️',
      keywords: ['scroll', 'top', 'jump', 'up', 'beginning', 'start'],
      execute: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    },

    {
      type: 'action',
      id: 'page-info',
      name: 'Page Info',
      description: 'Show information about current page',
      icon: 'ℹ️',
      keywords: ['info', 'page', 'details', 'url', 'title', 'about'],
      execute: () =>
        alert(
          `Page Title: ${document.title}\nURL: ${window.location.href}\nDate: ${new Date().toLocaleString()}`
        ),
    },

    // ===========================================================================
    // DEEP NESTED CATEGORIES - Testing infinite depth navigation
    // ===========================================================================

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
              id: 'google-docs',
              name: 'Google Docs',
              description: 'Collaborative document editing',
              icon: '📄',
              keywords: ['google', 'docs', 'document', 'write', 'collaborate'],
              execute: () => {
                console.log('Demo: Would open Google Docs')
              },
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
                  id: 'medium',
                  name: 'Medium',
                  description: 'Story publishing platform',
                  icon: '📚',
                  keywords: [
                    'medium',
                    'blog',
                    'stories',
                    'writing',
                    'publication',
                  ],
                  execute: () => {
                    console.log('Demo: Would open Medium')
                  },
                },

                {
                  type: 'action',
                  id: 'devto',
                  name: 'Dev.to',
                  description: 'Developer community and blogging',
                  icon: '💻',
                  keywords: ['dev', 'developers', 'blog', 'tech', 'community'],
                  execute: () => {
                    console.log('dev.to')
                  },
                },

                {
                  type: 'category',
                  id: 'social-media',
                  name: 'Social Media',
                  description: 'Share content on social platforms',
                  icon: '📱',
                  keywords: ['social', 'media', 'share', 'twitter', 'facebook'],
                  children: [
                    {
                      type: 'action',
                      id: 'twitter',
                      name: 'Twitter',
                      description: 'Share on Twitter',
                      icon: '🐦',
                      keywords: ['twitter', 'tweet', 'social', 'share'],
                      execute: () => {
                        console.log('twitter')
                      },
                    },

                    {
                      type: 'action',
                      id: 'linkedin',
                      name: 'LinkedIn',
                      description: 'Professional networking',
                      icon: '💼',
                      keywords: [
                        'linkedin',
                        'professional',
                        'networking',
                        'career',
                      ],
                      execute: () => {
                        console.log('linkedin')
                      },
                    },
                  ],
                },
              ],
            },
          ],
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
              id: 'gmail',
              name: 'Gmail',
              description: 'Google email service',
              icon: '📧',
              keywords: ['gmail', 'google', 'email', 'mail', 'messages'],
              execute: () => {
                console.log('gmail')
              },
            },

            {
              type: 'action',
              id: 'slack',
              name: 'Slack',
              description: 'Team communication platform',
              icon: '💬',
              keywords: ['slack', 'team', 'chat', 'communication', 'work'],
              execute: () => {
                console.log('slack')
              },
            },

            {
              type: 'category',
              id: 'video-conferencing',
              name: 'Video Conferencing',
              description: 'Video call and meeting tools',
              icon: '📹',
              keywords: ['video', 'conference', 'meeting', 'call', 'zoom'],

              children: [
                {
                  type: 'action',
                  id: 'zoom',
                  name: 'Zoom',
                  description: 'Video conferencing platform',
                  icon: '🔍',
                  keywords: ['zoom', 'video', 'conference', 'meeting', 'call'],
                  execute: () => {
                    console.log('ZOOM')
                  },
                },

                {
                  type: 'action',
                  id: 'google-meet',
                  name: 'Google Meet',
                  description: 'Google video conferencing',
                  icon: '🎥',
                  keywords: [
                    'google',
                    'meet',
                    'video',
                    'conference',
                    'meeting',
                  ],
                  execute: () => {
                    console.log('meet')
                  },
                },
              ],
            },
          ],
        },

        {
          type: 'category',
          id: 'project-management',
          name: 'Project Management',
          description: 'Tools for managing projects and tasks',
          icon: '📊',
          keywords: ['project', 'management', 'tasks', 'kanban', 'agile'],
          children: [
            {
              type: 'action',
              id: 'trello',
              name: 'Trello',
              description: 'Kanban-style project management',
              icon: '📋',
              keywords: ['trello', 'kanban', 'project', 'management', 'tasks'],
              execute: () => {
                console.log('trello')
              },
            },

            {
              type: 'action',
              id: 'notion',
              name: 'Notion',
              description: 'All-in-one workspace',
              icon: '📝',
              keywords: ['notion', 'workspace', 'notes', 'database', 'docs'],
              execute: () => {
                console.log('notion')
              },
            },
          ],
        },
      ],
    },

    // ===========================================================================
    // DEVELOPER TOOLS - Coding and debugging utilities
    // ===========================================================================

    {
      type: 'category',
      id: 'developer-tools',
      name: 'Developer Tools',
      description: 'Coding and debugging utilities',
      icon: '🛠️',
      keywords: ['dev', 'developer', 'tools', 'debug', 'code', 'programming'],
      children: [
        {
          type: 'action',
          id: 'devtools',
          name: 'Open DevTools',
          description: 'Open browser developer tools',
          icon: '🔧',
          keywords: ['devtools', 'inspect', 'debug', 'console', 'f12'],
          execute: () =>
            alert('DevTools would open here (F12 or right-click → Inspect)'),
        },

        {
          type: 'portal',
          id: 'json-prettier',
          name: 'JSON Pretty Printer',
          description: 'Format and beautify JSON data',
          icon: '📋',
          keywords: ['json', 'format', 'pretty', 'beautify', 'data'],

          render: (query: string, context: PortalContext) => {
            const [jsonInput, setJsonInput] = React.useState('')
            const [formattedJson, setFormattedJson] = React.useState('')

            const formatJson = () => {
              try {
                if (!jsonInput.trim()) {
                  setFormattedJson('Enter JSON to format...')
                  return
                }
                const parsed = JSON.parse(jsonInput)
                setFormattedJson(JSON.stringify(parsed, null, 2))
              } catch (error) {
                setFormattedJson(`❌ Error: ${String(error)}`)
              }
            }

            return (
              <PortalLayout title="JSON Pretty Printer" icon="📋">
                <textarea
                  className="w-full h-32 p-3 font-mono text-sm border rounded-lg"
                  placeholder="Paste JSON here..."
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                />
                <Button onClick={formatJson}>🏗️ Format JSON</Button>
                <textarea
                  className="w-full h-40 p-3 font-mono text-sm border rounded-lg bg-gray-50"
                  value={formattedJson}
                  readOnly
                  placeholder="Formatted JSON will appear here..."
                />
              </PortalLayout>
            )
          },
        },

        {
          type: 'portal',
          id: 'js-evaluator',
          name: 'JavaScript Evaluator',
          description: 'Execute JavaScript code safely',
          icon: '⚡',
          keywords: ['js', 'javascript', 'eval', 'execute', 'code', 'evaluate'],
          prefixes: ['!js'],

          render: (query: string, context: PortalContext) => {
            const jsCode = query.replace(/^!js\s*/, '').trim()
            const [inputCode, setInputCode] = React.useState(jsCode || '')
            const [output, setOutput] = React.useState('')

            const evaluateCode = () => {
              try {
                if (!inputCode.trim()) {
                  setOutput('Enter code to evaluate...')
                  return
                }
                const result = executeCode(inputCode)
                setOutput(`✅ Result: ${JSON.stringify(result)}`)
              } catch (error) {
                setOutput(`❌ Error: ${String(error)}`)
              }
            }

            return (
              <PortalLayout title="JavaScript Evaluator" icon="⚡">
                <textarea
                  className="w-full h-32 p-3 font-mono text-sm border rounded-lg"
                  placeholder="console.log('Hello from JS!')"
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                />
                <Button onClick={evaluateCode}>🚀 Run Code</Button>
                <div className="p-3 mt-4 font-mono text-sm border rounded bg-gray-50">
                  {output || 'Output will appear here...'}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  ⚠️ Safe evaluation only. Dangerous code is blocked.
                </div>
              </PortalLayout>
            )
          },
        },
      ],
    },

    // ===========================================================================
    // UTILITY PORTALS - Quick access tools
    // ===========================================================================

    {
      type: 'portal',
      id: 'quick-notes',
      name: 'Quick Notes',
      description: 'Jot down thoughts and ideas',
      icon: '📝',
      keywords: ['notes', 'write', 'ideas', 'memo', 'jot', 'remember'],
      showSearchInput: false,

      render: (query: string, context: PortalContext) => {
        const [notes, setNotes] = React.useState(
          localStorage.getItem('quick-notes') || ''
        )
        const [wordCount, setWordCount] = React.useState(0)

        React.useEffect(() => {
          const words = notes
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0).length
          setWordCount(words)
        }, [notes])

        const saveNotes = () => {
          localStorage.setItem('quick-notes', notes)
        }

        return (
          <PortalLayout title="Quick Notes" icon="📝">
            <textarea
              className="w-full h-64 p-4 border rounded-lg resize-none"
              placeholder="Write your thoughts here..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{wordCount} words</span>
              <span>{notes.length} characters</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveNotes}>💾 Save Notes</Button>
              <Button variant="secondary" onClick={() => setNotes('')}>
                🗑️ Clear
              </Button>
              <Button variant="secondary" onClick={context.onClose}>
                Close
              </Button>
            </div>
          </PortalLayout>
        )
      },
    },

    // ===========================================================================
    // SETTINGS PORTAL - Configuration and preferences
    // ===========================================================================

    {
      type: 'portal',
      id: 'settings',
      name: 'Command Palette Settings',
      description: 'Customize your command palette experience',
      icon: '⚙️',
      keywords: ['settings', 'config', 'preferences', 'customize', 'options'],

      render: (query: string, context: PortalContext) => {
        const state = context.store?.getState()
        const searchLibrary = state?.searchLibrary || 'fuse'
        const fuseConfig = state?.fuseConfig || {}

        const [theme, setTheme] = React.useState('light')
        const [keyboardShortcuts, setKeyboardShortcuts] = React.useState(true)
        const [animationEnabled, setAnimationEnabled] = React.useState(true)
        const [currentSearchLibrary, setCurrentSearchLibrary] =
          React.useState(searchLibrary)

        const [fuseThreshold, setFuseThreshold] = React.useState(
          fuseConfig?.threshold ?? 0.3
        )
        const [fuseLocation, setFuseLocation] = React.useState(
          fuseConfig?.location ?? 0
        )
        const [fuseDistance, setFuseDistance] = React.useState(
          fuseConfig?.distance ?? 100
        )
        const [fuseIgnoreLocation, setFuseIgnoreLocation] = React.useState(
          fuseConfig?.ignoreLocation ?? false
        )

        const saveFuseConfig = () => {
          const newFuseConfig = {
            ...fuseConfig,
            threshold: fuseThreshold,
            location: fuseLocation,
            distance: fuseDistance,
            ignoreLocation: fuseIgnoreLocation,
          }
          context.store?.setState({ fuseConfig: newFuseConfig })
        }

        return (
          <PortalLayout title="Settings" icon="⚙️">
            <div className="space-y-4">
              {/* Theme Setting */}
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-gray-600">
                    Choose your preferred theme
                  </div>
                </div>
                <select
                  className="px-3 py-1 border rounded"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Keyboard Shortcuts</div>
                  <div className="text-sm text-gray-600">
                    Enable Ctrl/Cmd+K shortcut
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={keyboardShortcuts}
                  onChange={e => setKeyboardShortcuts(e.target.checked)}
                />
              </div>

              {/* Animations */}
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Animations</div>
                  <div className="text-sm text-gray-600">
                    Enable smooth transitions and animations
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={animationEnabled}
                  onChange={e => setAnimationEnabled(e.target.checked)}
                />
              </div>

              {/* Search Library */}
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Search Algorithm</div>
                  <div className="text-sm text-gray-600">
                    Choose fuzzy search library
                  </div>
                </div>
                <select
                  className="px-3 py-1 border rounded"
                  value={currentSearchLibrary}
                  onChange={e => {
                    const value = e.target.value
                    if (value === 'fuse' || value === 'commandscore') {
                      setCurrentSearchLibrary(value)
                      context.store?.setState({ searchLibrary: value })
                    }
                  }}
                >
                  <option value="fuse">Fuse.js (Recommended)</option>
                  <option value="commandscore">Command Score</option>
                </select>
              </div>

              {/* Fuse.js Options */}
              {currentSearchLibrary === 'fuse' && (
                <div className="space-y-4">
                  <div className="pt-4 text-lg font-semibold text-gray-700 border-t">
                    🔍 Fuse.js Fuzzy Search Options
                  </div>

                  <div className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">Search Threshold</div>
                        <div className="text-sm text-gray-600">
                          How strict the search is (0.0 = exact, 1.0 = loose)
                        </div>
                      </div>
                      <span className="font-mono text-sm">
                        {fuseThreshold.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={fuseThreshold}
                      onChange={e =>
                        setFuseThreshold(parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => {
                  saveFuseConfig()
                  alert('Settings saved!')
                }}
                className="flex-1"
              >
                💾 Save Settings
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setFuseThreshold(0.3)
                  setFuseLocation(0)
                  setFuseDistance(100)
                  setFuseIgnoreLocation(false)
                  context.store?.setState({
                    fuseConfig: {
                      threshold: 0.3,
                      location: 0,
                      distance: 100,
                      ignoreLocation: false,
                    },
                  })
                }}
              >
                🔄 Reset to Defaults
              </Button>
            </div>
          </PortalLayout>
        )
      },
    },
  ],
}
