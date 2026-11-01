'use client'

import * as React from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadAdminImage } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function ImageUploadField({
  value,
  onChange,
  label = 'Image',
  className,
}: {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
  className?: string
}) {
  const [uploading, setUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadAdminImage(formData)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      onChange(result.data?.url ?? null)
      toast.success('Image uploaded')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <span className="mb-1.5 block text-sm font-medium text-secondary-700">{label}</span>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="h-28 w-40 rounded-xl border border-secondary-200 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-secondary-900 p-1 text-white shadow-md hover:bg-secondary-700"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-40 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-secondary-300 text-secondary-400 transition-colors hover:border-primary-400 hover:text-primary-500 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span className="text-xs">{uploading ? 'Uploading…' : 'Upload'}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <p className="mt-1 text-xs text-secondary-400">PNG or JPG, up to 5MB.</p>
    </div>
  )
}
