'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DoctorCard } from '@/components/doctors/DoctorCard'
import { DoctorFilters } from '@/components/doctors/DoctorFilters'
import { SortDropdown } from '@/components/doctors/SortDropdown'
import { SearchBar } from '@/components/common/SearchBar'
import { Pagination } from '@/components/common/Pagination'
import { DoctorListSkeleton, MapSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState, NoDoctorsFound } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { useDoctorSearch } from '@/lib/hooks/useDoctorSearch'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { MapPin, Filter, List, Map, ChevronDown, X } from 'lucide-react'
import { SPECIALTIES } from '@/lib/constants'
import { SearchFilters } from '@/lib/types'
import { useState, useEffect } from 'react'

export function DoctorsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { latitude, longitude, getCurrentPosition, loading: locationLoading } = useGeolocation()
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [selectedDoctor, setSelectedDoctor] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = React.useState<SearchFilters['sort_by']>(searchParams.get('sort_by') as SearchFilters['sort_by'] || 'best_match')
  const [currentFilters, setCurrentFilters] = React.useState<SearchFilters>({
    specialty: searchParams.get('specialty') || undefined,
    distance_km: searchParams.get('distance') ? parseInt(searchParams.get('distance')!) : undefined,
    min_rating: searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : undefined,
    min_experience: searchParams.get('min_experience') ? parseInt(searchParams.get('min_experience')!) : undefined,
    available_today: searchParams.get('available_today') === 'true',
    available_now: searchParams.get('available_now') === 'true',
    hospital_id: searchParams.get('hospital_id') || undefined,
    gender: searchParams.get('gender') || undefined,
    language: searchParams.get('language') || undefined,
    max_fee: searchParams.get('max_fee') ? parseInt(searchParams.get('max_fee')!) : undefined,
    sort_by: sortBy as SearchFilters['sort_by'],
  })

  const location = latitude && longitude ? { latitude, longitude } : null

  const { doctors, totalCount, loading, error, hasMore, page, loadMore, updateFilters, clearFilters, setSearch } = useDoctorSearch({
    initialFilters: currentFilters,
    location,
    autoSearch: true,
  })

  const [hospitals, setHospitals] = React.useState<Array<{ id: string; name: string }>>([])

  React.useEffect(() => {
    const fetchHospitals = async () => {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data } = await supabase.from('hospitals').select('id, name').order('name')
      if (data) setHospitals(data)
    }
    fetchHospitals()
  }, [])

  const hasActiveFilters = Object.values(currentFilters).some(v => v !== undefined && v !== null && v !== '' && v !== false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setSearch(query)
    const params = new URLSearchParams(searchParams)
    params.set('q', query)
    params.set('page', '1')
    router.push(`/doctors?${params.toString()}`)
  }

  const handleFilterChange = (newFilters: SearchFilters) => {
    setCurrentFilters(newFilters)
    updateFilters(newFilters)
    const params = new URLSearchParams(searchParams)
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        params.set(key, value.toString())
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1')
    router.push(`/doctors?${params.toString()}`)
  }

  const handleClearFilters = () => {
    clearFilters()
    const params = new URLSearchParams(searchParams)
    params.delete('specialty')
    params.delete('distance')
    params.delete('min_rating')
    params.delete('min_experience')
    params.delete('available_today')
    params.delete('available_now')
    params.delete('hospital_id')
    params.delete('gender')
    params.delete('language')
    params.delete('max_fee')
    params.set('page', '1')
    router.push(`/doctors?${params.toString()}`)
  }

  const handleSortChange = (value: SearchFilters['sort_by']) => {
    setSortBy(value)
    updateFilters({ sort_by: value })
    const params = new URLSearchParams(searchParams)
    params.set('sort_by', value || 'best_match')
    params.set('page', '1')
    router.push(`/doctors?${params.toString()}`)
  }

  const handleLocationClick = () => {
    if (!location) {
      getCurrentPosition()
    }
  }

  const handleSearchClick = () => {
    handleSearch(searchQuery)
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Page Header */}
      <div className="bg-white border-b border-secondary-200 sticky top-16 z-40">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">
                {searchQuery ? `Results for "${searchQuery}"` : 'Find Doctors Near You'}
              </h1>
              <p className="text-secondary-500 mt-1">
                {totalCount} {totalCount === 1 ? 'doctor' : 'doctors'} found
                {location && <span className="ml-2 flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" />
                  Near you
                </span>}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearchClick}
                location={location}
                onUseLocation={handleLocationClick}
                loading={locationLoading}
              />
              
              <div className="flex items-center gap-2">
                <SortDropdown value={sortBy} onChange={handleSortChange} />
                
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('map')}
                  aria-label="Map view"
                >
                  <Map className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List className="h-5 w-5" />
                </Button>

                <Button
                  variant={filtersOpen ? 'default' : 'outline'}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="h-5 w-5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex items-center justify-center">
                      {Object.values(currentFilters).filter(v => v !== undefined && v !== null && v !== '' && v !== false).length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:static lg:z-auto bg-white lg:border-0 lg:shadow-none">
          <div className="lg:static lg:relative">
            <DoctorFilters
              filters={currentFilters}
              onFiltersChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              specialties={SPECIALTIES.map(s => ({ id: s.id, name: s.name }))}
              hospitals={hospitals}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="container py-6">
        {viewMode === 'map' ? (
          <div className="h-[600px] rounded-xl overflow-hidden border border-secondary-200">
            {loading ? (
              <MapSkeleton />
            ) : error ? (
              <ErrorState
                title="Failed to load map"
                message={error}
                onRetry={() => window.location.reload()}
              />
            ) : (
              <div className="h-full">
                {/* MapView would go here */}
                <div className="h-full flex items-center justify-center bg-secondary-100">
                  <p className="text-secondary-500">Map view coming soon</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {loading && <DoctorListSkeleton count={5} />}
            
            {error && !loading && (
              <ErrorState
                title="Failed to load doctors"
                message={error}
                onRetry={() => window.location.reload()}
              />
            )}
            
            {!loading && !error && doctors.length === 0 && (
              <NoDoctorsFound
                onIncreaseDistance={() => handleFilterChange({ ...currentFilters, distance_km: (currentFilters.distance_km || 5) + 5 })}
                onRemoveFilters={handleClearFilters}
                onChangeSpecialty={() => router.push('/specialties')}
                onChangeLocation={handleLocationClick}
                filters={{ specialty: currentFilters.specialty, distance_km: currentFilters.distance_km }}
              />
            )}
            
            {!loading && !error && doctors.length > 0 && (
              <>
                <div className="space-y-4" role="list" aria-label="Doctors">
                  {doctors.map((doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      userLocation={location}
                      onViewProfile={() => router.push(`/doctors/${doctor.id}`)}
                      onViewAvailability={() => router.push(`/doctors/${doctor.id}?tab=availability`)}
                      onGetDirections={() => window.open(`https://maps.google.com/?daddr=${doctor.latitude},${doctor.longitude}`, '_blank')}
                      onCall={() => window.open(`tel:+91${doctor.hospitals?.[0]?.phone || ''}`, '_self')}
                      onBookAppointment={() => router.push(`/appointments/new?doctor=${doctor.id}`)}
                      showCompare
                      compared={selectedDoctor === doctor.id}
                      onCompare={() => setSelectedDoctor(selectedDoctor === doctor.id ? null : doctor.id)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-6 py-3 text-secondary-600 hover:text-secondary-900 font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                      {loading ? 'Loading...' : 'Load More Doctors'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}