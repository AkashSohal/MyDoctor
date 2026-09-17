'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Doctor, SearchFilters, SearchResult, Location } from '@/lib/types'

interface UseDoctorSearchOptions {
  initialFilters?: SearchFilters
  location?: Location | null
  autoSearch?: boolean
}

export function useDoctorSearch(options: UseDoctorSearchOptions = {}) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>(options.initialFilters || {})
  const [searchQuery, setSearchQuery] = useState('')

  const perPage = 20
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const locationRef = useRef(options.location)
  const filtersRef = useRef(filters)
  const searchQueryRef = useRef(searchQuery)

  useEffect(() => {
    locationRef.current = options.location
  }, [options.location])

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  useEffect(() => {
    searchQueryRef.current = searchQuery
  }, [searchQuery])

  const searchDoctors = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    const loc = locationRef.current

    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams({
        page: pageNum.toString(),
        per_page: perPage.toString(),
      })

      if (loc?.latitude && loc?.longitude) {
        searchParams.append('lat', loc.latitude.toString())
        searchParams.append('lng', loc.longitude.toString())
      }

      const currentFilters = filtersRef.current
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const query = searchQueryRef.current
      if (query) {
        searchParams.append('q', query)
      }

      const response = await fetch(`/api/doctors/search?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to search doctors')
      }

      const result: SearchResult = await response.json()

      if (append) {
        setDoctors(prev => [...prev, ...result.doctors])
      } else {
        setDoctors(result.doctors)
      }
      
      setTotalCount(result.total_count)
      setHasMore(result.has_more)
      setPage(result.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (options.autoSearch) {
      searchDoctors(1)
    }
  }, [options.autoSearch, searchDoctors])

  useEffect(() => {
    if (locationRef.current) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        searchDoctors(1)
      }, 300)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filters, searchQuery, searchDoctors])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      searchDoctors(page + 1, true)
    }
  }, [loading, hasMore, page, searchDoctors])

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setPage(1)
  }, [])

  const setSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setPage(1)
  }, [])

  return {
    doctors,
    totalCount,
    loading,
    error,
    page,
    hasMore,
    filters,
    searchQuery,
    searchDoctors,
    loadMore,
    updateFilters,
    clearFilters,
    setSearch,
    setFilters,
  }
}
