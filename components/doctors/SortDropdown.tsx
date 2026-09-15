'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown'
import { SearchFilters } from '@/lib/types'
import { SORT_OPTIONS } from '@/lib/constants'
import { Check, ChevronDown } from 'lucide-react'

interface SortDropdownProps {
  value: SearchFilters['sort_by']
  onChange: (value: SearchFilters['sort_by']) => void
  className?: string
}

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  const currentSort = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-1', className)}
        >
          <span>Sort</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onChange(option.value)}
            className="flex items-center gap-2"
          >
            <span>{option.label}</span>
            {value === option.value && <Check className="h-4 w-4 text-primary-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}