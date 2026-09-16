'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, children, ...props }, ref) => {
    if (children) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative flex items-center py-4',
            className
          )}
          {...props}
        >
          <div className="flex-1 border-t border-secondary-200" />
          <span className="px-3 text-sm text-secondary-500 bg-white">{children}</span>
          <div className="flex-1 border-t border-secondary-200" />
        </div>
      )
    }
    return (
      <div
        ref={ref}
        className={cn(
          'shrink-0 bg-secondary-200',
          orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
          className
        )}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={decorative ? undefined : orientation}
        {...props}
      />
    )
  }
)
Separator.displayName = 'Separator'

export { Separator }