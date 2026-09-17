'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Search, Filter, MapPin, Stethoscope, Smile, Frown, Shield, Star, Heart, MapPin as MapPinIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 text-secondary-400">
        {icon || (
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-secondary-900">{title}</h3>
      <p className="mt-2 text-secondary-500 max-w-md">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {action && (
            <Button variant={action.variant || 'default'} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function NoDoctorsFound({
  onIncreaseDistance,
  onRemoveFilters,
  onChangeSpecialty,
  onChangeLocation,
  filters,
}: {
  onIncreaseDistance?: () => void
  onRemoveFilters?: () => void
  onChangeSpecialty?: () => void
  onChangeLocation?: () => void
  filters?: {
    specialty?: string
    distance_km?: number
  }
}) {
  const suggestions = []

  if (filters?.specialty) {
    suggestions.push(
      <div key="specialty" className="flex items-center gap-3 text-secondary-600">
        <Stethoscope className="h-5 w-5 text-primary-600 shrink-0" />
        <div>
          <p className="font-medium">No {filters.specialty}s found</p>
          <p className="text-sm">Try a different specialty</p>
        </div>
      </div>
    )
  }

  if (filters?.distance_km && filters.distance_km < 25) {
    suggestions.push(
      <button
        key="distance"
        onClick={onIncreaseDistance}
        className="flex items-center gap-3 text-secondary-600 hover:text-secondary-900 transition-colors"
      >
        <MapPin className="h-5 w-5 text-primary-600 shrink-0" />
        <div className="text-left">
          <p className="font-medium">Increase search radius</p>
          <p className="text-sm">Currently searching within {filters.distance_km} km</p>
        </div>
      </button>
    )
  }

  suggestions.push(
    <button
      key="filters"
      onClick={onRemoveFilters}
      className="flex items-center gap-3 text-secondary-600 hover:text-secondary-900 transition-colors"
    >
      <Filter className="h-5 w-5 text-primary-600 shrink-0" />
      <div className="text-left">
        <p className="font-medium">Remove all filters</p>
        <p className="text-sm">Show all doctors in the area</p>
      </div>
    </button>
  )

  if (onChangeSpecialty) {
    suggestions.push(
      <button
        key="specialty-browse"
        onClick={onChangeSpecialty}
        className="flex items-center gap-3 text-secondary-600 hover:text-secondary-900 transition-colors"
      >
        <Stethoscope className="h-5 w-5 text-primary-600 shrink-0" />
        <div className="text-left">
          <p className="font-medium">Browse by specialty</p>
          <p className="text-sm">Explore different medical specialties</p>
        </div>
      </button>
    )
  }

  if (onChangeLocation) {
    suggestions.push(
      <button
        key="location"
        onClick={onChangeLocation}
        className="flex items-center gap-3 text-secondary-600 hover:text-secondary-900 transition-colors"
      >
        <MapPinIcon className="h-5 w-5 text-primary-600 shrink-0" />
        <div className="text-left">
          <p className="font-medium">Change location</p>
          <p className="text-sm">Search in a different area</p>
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary-100 text-secondary-400">
        <Search className="h-10 w-10" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-secondary-900">No doctors found</h3>
      <p className="mt-2 text-secondary-500 max-w-md">
        We couldn't find any doctors matching your search criteria.
      </p>
      <div className="mt-8 w-full max-w-md space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.key}
            className={cn(
              'p-4 rounded-xl border border-secondary-200 bg-white text-left transition-colors',
              suggestion.type === 'button' ? 'hover:border-primary-300 hover:bg-primary-50 cursor-pointer' : ''
            )}
          >
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  )
}

export function NoResultsFound({
  query,
  onClearSearch,
}: {
  query?: string
  onClearSearch?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary-100 text-secondary-400">
        <Frown className="h-10 w-10" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-secondary-900">No results for "{query}"</h3>
      <p className="mt-2 text-secondary-500 max-w-md">
        Try adjusting your search terms or browse our specialties below.
      </p>
      {onClearSearch && (
        <Button variant="outline" onClick={onClearSearch} className="mt-6">
          Clear Search
        </Button>
      )}
    </div>
  )
}

export function NoLocationAccess({
  onRequestPermission,
  onManualSearch,
}: {
  onRequestPermission: () => void
  onManualSearch: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
        <MapPin className="h-10 w-10" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-secondary-900">Location access needed</h3>
      <p className="mt-2 text-secondary-500 max-w-md">
        To find doctors near you, we need access to your location. You can enable it in your browser settings or search manually.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button onClick={onRequestPermission}>
          Enable Location
        </Button>
        <Button variant="outline" onClick={onManualSearch}>
          Search Manually
        </Button>
      </div>
    </div>
  )
}