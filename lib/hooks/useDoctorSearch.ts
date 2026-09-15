'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Doctor, SearchFilters, SearchResult, Location } from '@/lib/types'
import { debounce } from '@/lib/utils'

const supabase = createClient()

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

  const searchDoctors = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!options.location?.latitude || !options.location?.longitude) {
      setError('Location is required to search for doctors')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams({
        lat: options.location.latitude.toString(),
        lng: options.location.longitude.toString(),
        page: pageNum.toString(),
        per_page: perPage.toString(),
      })

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      if (searchQuery) {
        searchParams.append('q', searchQuery)
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
  }, [options.location, filters, searchQuery])

  const debouncedSearch = useCallback(
    debounce((pageNum: number) => searchDoctors(pageNum), 300),
    [searchDoctors]
  )

  useEffect(() => {
    if (options.autoSearch && options.location) {
      searchDoctors(1)
    }
  }, [options.autoSearch, options.location])

  useEffect(() => {
    if (options.location) {
      debouncedSearch(1)
    }
  }, [filters, searchQuery, options.location])

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