export interface GeocodeResult {
  latitude: number
  longitude: number
  label: string
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const TIMEOUT_MS = 8000

/**
 * Geocode a free-text location ("Bengaluru", "560076", "Indiranagar, Bengaluru")
 * using the OpenStreetMap Nominatim service (no API key required, same provider
 * family as the Leaflet maps used across the app).
 *
 * Returns null when the location cannot be found or the service is unreachable,
 * so callers can show an honest error instead of guessing coordinates.
 */
export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'in',
    })

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) return null

    const results: Array<{ lat: string; lon: string; display_name: string }> = await response.json()
    const first = results[0]
    if (!first) return null

    return {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
      label: first.display_name,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
