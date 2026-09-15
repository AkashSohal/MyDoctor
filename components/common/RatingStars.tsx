'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
  showValue?: boolean
  className?: string
}

const starSizes = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const Star = ({ filled = false, half = false, size = 'md', className }: { filled?: boolean; half?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  if (half) {
    return (
      <span className={cn('relative inline-block', starSizes[size], className)}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="text-secondary-300" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <div className="absolute inset-0 overflow-hidden">
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-amber-500" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </span>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="2"
      className={cn(starSizes[size], filled ? 'text-amber-500' : 'text-secondary-300', className)}
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function RatingStars({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  interactive = false, 
  onChange, 
  showValue = false,
  className 
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = React.useState(0)
  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating

  const fullStars = Math.floor(displayRating)
  const hasHalfStar = displayRating % 1 >= 0.5

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, value: number) => {
    if (!interactive) return
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onChange?.(value)
    } else if (event.key === 'ArrowRight' && value < maxRating) {
      event.preventDefault()
      onChange?.(value + 1)
    } else if (event.key === 'ArrowLeft' && value > 1) {
      event.preventDefault()
      onChange?.(value - 1)
    }
  }

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)} role={interactive ? 'radiogroup' : 'img'} aria-label={`${rating} out of ${maxRating} stars`}>
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <React.Fragment key={star}>
          {star <= fullStars ? (
            <button
              type="button"
              role="radio"
              aria-checked={star === Math.round(rating)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              tabIndex={interactive ? 0 : -1}
              onClick={() => handleClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              className="p-0 bg-transparent border-0 cursor-pointer"
              disabled={!interactive}
            >
              <Star filled size={size} />
            </button>
          ) : star === fullStars + 1 && hasHalfStar ? (
            <button
              type="button"
              role="radio"
              aria-checked={false}
              aria-label={`${star - 0.5} stars`}
              tabIndex={interactive ? 0 : -1}
              onClick={() => handleClick(star - 0.5)}
              onMouseEnter={() => interactive && setHoverRating(star - 0.5)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onKeyDown={(e) => handleKeyDown(e, star - 0.5)}
              className="p-0 bg-transparent border-0 cursor-pointer"
              disabled={!interactive}
            >
              <Star half size={size} />
            </button>
          ) : (
            <button
              type="button"
              role="radio"
              aria-checked={false}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              tabIndex={interactive ? 0 : -1}
              onClick={() => handleClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              className="p-0 bg-transparent border-0 cursor-pointer"
              disabled={!interactive}
            >
              <Star size={size} />
            </button>
          )}
        </React.Fragment>
      ))}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-secondary-700">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}