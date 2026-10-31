'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Doctor, SearchFilters, SearchResult, Location } from '@/lib/types'

interface UseDoctorSearchOptions {
  initialFilters?: SearchFilters
  initialQuery?: string
  location?: Location | null
  autoSearch?: boolean
}

interface CacheEntry {
  data: SearchResult
  at: number
}

const PER_PAGE = 20
// Short TTL: results include time-sensitive availability flags, so we reuse
// them only briefly and always revalidate in the background.
const CACHE_TTL_MS = 30_000
const DEBOUNCE_MS = 300

// Module-level cache so navigating back to the search page (or between
// filtered views) reuses valid results instead of refetching from scratch.
const searchCache = new Map<string, CacheEntry>()

function buildSearchParams(
  pageNum: number,
  location: Location | null | undefined,
  filters: SearchFilters,
  query: string
): URLSearchParams {
  const searchParams = new URLSearchParams({
    page: pageNum.toString(),
    per_page: PER_PAGE.toString(),
  })

  if (location?.latitude && location?.longitude) {
    searchParams.append('lat', location.latitude.toString())
    searchParams.append('lng', location.longitude.toString())
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString())
    }
  })

  if (query) {
    searchParams.append('q', query)
  }

  return searchParams
}

export function useDoctorSearch(options: UseDoctorSearchOptions = {}) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>(options.initialFilters || {})
  const [searchQuery, setSearchQuery] = useState(options.initialQuery || '')

  const abortRef = useRef<AbortController | null>(null)
  // Monotonic id so a slow, outdated response can never overwrite a newer one.
  const requestIdRef = useRef(0)
  const lastFetchKeyRef = useRef<string | null>(null)
  const locationRef = useRef(options.location)
  const filtersRef = useRef(filters)
  const searchQueryRef = useRef(searchQuery)
  const mountedRef = useRef(false)

  useEffect(() => {
    locationRef.current = options.location
  }, [options.location])

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  useEffect(() => {
    searchQueryRef.current = searchQuery
  }, [searchQuery])

  const applyResult = useCallback((result: SearchResult, append: boolean) => {
    setDoctors(prev => (append ? [...prev, ...result.doctors] : result.doctors))
    setTotalCount(result.total_count)
    setHasMore(result.has_more)
    setPage(result.page)
  }, [])

  const searchDoctors = useCallback(
    async (pageNum: number = 1, append: boolean = false, force: boolean = false) => {
      const params = buildSearchParams(pageNum, locationRef.current, filtersRef.current, searchQueryRef.current)
      const key = params.toString()

      // Identical in-flight/completed search — skip to avoid duplicate requests
      // (this is what previously caused two requests on every page mount).
      if (!append && !force && key === lastFetchKeyRef.current) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const requestId = ++requestIdRef.current

      // Serve a cached copy instantly (stale-while-revalidate).
      const cached = searchCache.get(key)
      const isFresh = cached && Date.now() - cached.at < CACHE_TTL_MS

      if (!append && cached) {
        applyResult(cached.data, false)
        setError(null)
        if (isFresh) {
          lastFetchKeyRef.current = key
          setLoading(false)
          return
        }
        setLoading(true) // stale cache: show data, refresh in background
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const response = await fetch(`/api/doctors/search?${key}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          let message = 'Failed to search doctors'
          try {
            const body = await response.json()
            if (body && typeof body.error === 'string' && body.error.trim()) {
              message = body.error
            }
          } catch {
            // Non-JSON error body: keep the generic message.
          }
          throw new Error(message)
        }

        const result: SearchResult = await response.json()

        // Ignore responses that arrive after the user has already moved on.
        if (requestId !== requestIdRef.current) return

        if (append) {
          setDoctors(prev => [...prev, ...result.doctors])
          setTotalCount(result.total_count)
          setHasMore(result.has_more)
          setPage(result.page)
        } else {
          applyResult(result, false)
          searchCache.set(key, { data: result, at: Date.now() })
          lastFetchKeyRef.current = key
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (requestId !== requestIdRef.current) return
        // Keep stale cached data on screen instead of blanking the list.
        if (!cached) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [applyResult]
  )

  // Single search pipeline: immediate on first load, debounced on changes.
  useEffect(() => {
    if (!options.autoSearch) return

    if (!mountedRef.current) {
      mountedRef.current = true
      searchDoctors(1)
      return
    }

    const timeout = setTimeout(() => {
      lastFetchKeyRef.current = null // filters/query changed — allow a new request
      searchDoctors(1)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [filters, searchQuery, options.autoSearch, options.location, searchDoctors])

  // Cancel any in-flight request when the consumer unmounts.
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

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
