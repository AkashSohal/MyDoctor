'use client'

import * as React from 'react'
import { Crosshair, MapPin, Copy, MessageSquare, ExternalLink, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEmergencyLocation } from '@/lib/emergency/useEmergencyLocation'
import {
  buildMapsUrl,
  buildShareText,
  buildSmsHref,
  formatCoordinates,
} from '@/lib/emergency'
import type { EmergencyContact } from '@/lib/emergency/storage'
import { toast } from 'sonner'

interface LocationShareProps {
  contacts: EmergencyContact[]
  /** Renders the request button as a full-width action (SOS dialog). */
  block?: boolean
}

/**
 * Requests location permission and shares the position with saved
 * emergency contacts. Explains every permission outcome — including denial.
 */
export function LocationShare({ contacts, block = false }: LocationShareProps) {
  const location = useEmergencyLocation()
  const [copied, setCopied] = React.useState(false)

  const hasCoords = location.latitude !== null && location.longitude !== null
  const usableContacts = contacts.filter((contact) => contact.phone.trim().length > 0)
  const shareText = hasCoords
    ? buildShareText(location.latitude as number, location.longitude as number)
    : ''

  const handleShare = async () => {
    if (!hasCoords) {
      location.requestLocation()
      return
    }
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText })
        toast.success('Share sheet opened — pick a contact to send your location.')
        return
      }
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success('Location copied. Paste it into any message.')
    } catch (error) {
      // The user closing the native share sheet is not an error.
      if ((error as Error)?.name === 'AbortError') return
      toast.error('Could not open sharing. Copy the location below instead.')
    }
  }

  const handleCopy = async () => {
    if (!hasCoords) return
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success('Location copied to clipboard.')
    } catch {
      toast.error('Copying is blocked in this browser. Use the maps link instead.')
    }
  }

  const statusStyles =
    location.status === 'denied'
      ? 'border-red-200 bg-red-50 text-red-700'
      : location.status === 'granted'
        ? 'border-primary-200 bg-primary-50 text-primary-800'
        : 'border-secondary-200 bg-secondary-50 text-secondary-600'

  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-secondary-900">
            <MapPin className="h-4 w-4 text-red-600" aria-hidden="true" />
            Share my location
          </p>
          <p className="mt-1 text-xs text-secondary-500">
            Location is requested only when you tap the button, and is never sent anywhere until you share it.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
          loading={location.status === 'locating'}
          onClick={location.requestLocation}
        >
          <Crosshair className="h-4 w-4" aria-hidden="true" />
          {hasCoords ? 'Refresh' : 'Locate me'}
        </Button>
      </div>

      {location.message && (
        <p
          role={location.status === 'denied' ? 'alert' : 'status'}
          className={`mt-3 rounded-lg border p-3 text-xs font-medium ${statusStyles}`}
        >
          {location.message}
        </p>
      )}

      {hasCoords && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary-50 px-3 py-2">
            <span className="text-sm font-medium tabular-nums text-secondary-700">
              {formatCoordinates(location.latitude as number, location.longitude as number)}
            </span>
            <a
              href={buildMapsUrl(location.latitude as number, location.longitude as number)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Open in Maps
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => void handleShare()}
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Share now
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void handleCopy()}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          {usableContacts.length > 0 ? (
            <a
              href={buildSmsHref(
                usableContacts.map((contact) => contact.phone),
                shareText
              )}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Send SMS to {usableContacts.length} emergency contact
              {usableContacts.length > 1 ? 's' : ''}
            </a>
          ) : (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              No emergency contact saved yet. Add one under “Emergency Contacts” to send them your location with one tap.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
