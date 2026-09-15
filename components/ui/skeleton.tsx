'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, ...props }, ref) => {
    const baseStyles = 'animate-pulse rounded bg-secondary-200'
    
    const variantStyles = {
      text: 'h-4 w-full',
      circular: 'rounded-full',
      rectangular: 'rounded-xl',
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        style={{ width, height }}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

export { Skeleton }