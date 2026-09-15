'use client'

import { useState, useCallback, useRef } from 'react'

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: GeolocationPositionError | null
  loading: boolean
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  })

  const watchIdRef = useRef<number | null>(null)

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: { code: 0, message: 'Geolocation is not supported by this browser', name: 'GeolocationError' } as unknown as GeolocationPositionError,
        loading: false,
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      position => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      error => {
        setState(prev => ({
          ...prev,
          error,
          loading: false,
        }))
      },
      options
    )
  }, [options])

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: { code: 0, message: 'Geolocation is not supported by this browser', name: 'GeolocationError' } as unknown as GeolocationPositionError,
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      error => {
        setState(prev => ({
          ...prev,
          error,
          loading: false,
        }))
      },
      options
    )
  }, [options])

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
    clearWatch,
  }
}