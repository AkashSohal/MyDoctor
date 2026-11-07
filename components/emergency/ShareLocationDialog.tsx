'use client'

import * as React from 'react'
import {
  MapPin,
  Crosshair,
  Copy,
  MessageSquare,
  ExternalLink,
  ShieldAlert,
  Share2,
} from 'lucide-react'
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

interface ShareLocationDialogProps {
  open: boolean
  contact: EmergencyContact | null
  onCancel: () => void
}

/**
 * Shares the current position with ONE chosen contact.
 *
 * Nothing leaves the device until the user presses a share button:
 * first they grant location, then they explicitly confirm the share.
 */
export function ShareLocationDialog({ open, contact, onCancel }: ShareLocationDialogProps) {
  const location = useEmergencyLocation()
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setCopied(false)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open || !contact) return null

  const hasCoords = location.latitude !== null && location.longitude !== null
  const shareText = hasCoords
    ? buildShareText(location.latitude as number, location.longitude as number)
    : ''
  const mapsUrl = hasCoords
    ? buildMapsUrl(location.latitude as number, location.longitude as number)
    : ''

  const handleNativeShare = async () => {
    if (!hasCoords) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My current location',
          text: shareText,
        })
        toast.success('Share sheet opened — choose how to send your location.')
        onCancel()
        return
      }
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success('Sharing is not supported here — location copied instead.')
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return
      toast.error('Could not open sharing. Copy the location link instead.')
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

  const handleSms = () => {
    if (!hasCoords) return
    const href = buildSmsHref([contact.phone], shareText)
    if (!href) {
      toast.error('This contact has no valid phone number for SMS.')
      return
    }
    window.location.href = href
    onCancel()
  }

  const statusStyles =
    location.status === 'denied'
      ? 'border-red-200 bg-red-50 text-red-700'
      : location.status === 'granted'
        ? 'border-primary-200 bg-primary-50 text-primary-800'
        : 'border-secondary-200 bg-secondary-50 text-secondary-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-location-title"
        className="relative w-full max-w-md overflow-y-auto rounded-2xl border border-secondary-200 bg-white p-6 shadow-2xl animate-scale-in"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="share-location-title" className="text-lg font-bold text-secondary-900">
              Share location with {contact.name}
            </h2>
            <p className="mt-1 text-sm text-secondary-500">
              Your position is requested now and sent only when you choose a share option below.
            </p>
          </div>
        </div>

        {!hasCoords ? (
          <div className="mt-5 space-y-3">
            <Button
              variant="destructive"
              className="w-full gap-2"
              loading={location.status === 'locating'}
              onClick={location.requestLocation}
            >
              <Crosshair className="h-4 w-4" aria-hidden="true" />
              Get my current location
            </Button>
            {location.message && (
              <p
                role={location.status === 'denied' ? 'alert' : 'status'}
                className={`rounded-xl border p-3 text-xs font-medium ${statusStyles}`}
              >
                {location.message}
                {location.status === 'denied' && (
                  <button
                    type="button"
                    className="mt-1.5 block font-semibold underline"
                    onClick={location.requestLocation}
                  >
                    Try again
                  </button>
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="space-y-2 rounded-xl border border-secondary-200 bg-secondary-50 p-3">
              <p className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums text-secondary-700">
                {formatCoordinates(location.latitude as number, location.longitude as number)}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Open in Maps
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </p>
              {location.source === 'manual' && (
                <p className="text-xs text-secondary-500">
                  Manual location: {location.label} — not your device position.
                </p>
              )}
              <p className="break-all text-xs text-secondary-500">{mapsUrl}</p>
            </div>

            <div className="grid gap-2">
              <Button variant="destructive" className="w-full gap-2" onClick={() => void handleNativeShare()}>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share now (system share sheet)
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={handleSms}>
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Send SMS to {contact.name}
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => void handleCopy()}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copied ? 'Copied' : 'Copy location link'}
              </Button>
            </div>

            <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Only share your location with someone you trust. MyDoctor never sends it automatically.
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
