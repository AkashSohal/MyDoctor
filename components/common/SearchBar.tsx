'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { EXAMPLE_SEARCHES } from '@/lib/constants'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  placeholder?: string
  location?: { latitude: number; longitude: number } | { lat: number; lng: number } | null
  onUseLocation: () => void
  loading?: boolean
  className?: string
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search doctor, specialty or hospital',
  location,
  onUseLocation,
  loading,
  className,
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const { getCurrentPosition } = useGeolocation()

  const handleLocationClick = () => {
    if (location) {
      onUseLocation()
    } else {
      getCurrentPosition()
      // The actual location handling would be done by parent
    }
  }

  return (
    <div className={cn('relative w-full max-w-3xl', className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-secondary-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder={placeholder}
          className={cn(
            'flex h-12 w-full rounded-xl border border-secondary-300 bg-white pl-12 pr-12 py-3 text-lg text-secondary-900 placeholder:text-secondary-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'hover:border-secondary-400'
          )}
        />
        <Button
          type="button"
          onClick={onSearch}
          disabled={loading || !value.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 px-4"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Find Doctors'
          )}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-secondary-500">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLocationClick}
          disabled={loading}
          className="gap-1.5 h-8 px-3"
        >
          <MapPin className="h-4 w-4" />
          {location ? 'Update Location' : 'Use My Location'}
        </Button>
        <span className="hidden sm:inline">or</span>
        {EXAMPLE_SEARCHES.slice(0, 4).map((search) => (
          <Button
            key={search}
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(search)
              onSearch()
            }}
            className="h-8 px-3 text-xs"
          >
            {search}
          </Button>
        ))}
      </div>

      {showSuggestions && value && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-secondary-200 bg-white shadow-lg">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-medium text-secondary-500 uppercase">Popular searches</p>
            {EXAMPLE_SEARCHES.map((search) => (
              <button
                key={search}
                onClick={() => {
                  onChange(search)
                  onSearch()
                }}
                className="w-full px-3 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}