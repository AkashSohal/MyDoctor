'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-24 w-24 text-2xl',
}

// Actual rendered pixel sizes per variant (for responsive image hints).
const sizeHints = {
  xs: '24px',
  sm: '32px',
  md: '40px',
  lg: '48px',
  xl: '64px',
  '2xl': '96px',
}

// next/image throws for hosts that are not in next.config.js — only use it
// for known-safe sources, and fall back to a lazy <img> for anything else.
function isOptimizableSrc(src: string): boolean {
  if (src.startsWith('/')) return true
  try {
    const { protocol, hostname } = new URL(src, 'http://localhost')
    if (protocol !== 'https:' && protocol !== 'http:') return false
    return (
      hostname.endsWith('.supabase.co') ||
      hostname === 'lh3.googleusercontent.com' ||
      hostname === 'avatars.githubusercontent.com'
    )
  } catch {
    return false
  }
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    if (src && !imageError) {
      const optimizable = isOptimizableSrc(src)
      return (
        <div
          ref={ref}
          className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full', sizeClasses[size], className)}
          {...props}
        >
          {optimizable ? (
            <Image
              src={src}
              alt={alt || fallback || 'Avatar'}
              fill
              sizes={sizeHints[size]}
              className="aspect-square h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
          ) : (
            // Intentional plain <img> for hosts not allowlisted in next.config.js
            // (next/image throws for unknown remote patterns).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || fallback || 'Avatar'}
              className="aspect-square h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {fallback ? getInitials(fallback) : '?'}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar }
