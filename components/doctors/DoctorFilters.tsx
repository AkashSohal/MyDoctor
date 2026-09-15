'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  X, 
  Filter, 
  Stethoscope, 
  MapPin, 
  Star, 
  Calendar, 
  Clock, 
  Building2, 
  IndianRupee,
  User,
  Languages,
  Award
} from 'lucide-react'
import { SearchFilters } from '@/lib/types'
import { SPECIALTIES, DISTANCE_FILTERS, SORT_OPTIONS, GENDER_OPTIONS, LANGUAGES } from '@/lib/constants'

interface DoctorFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onClearFilters: () => void
  specialties: { id: string; name: string }[]
  hospitals: { id: string; name: string }[]
  hasActiveFilters: boolean
  className?: string
}

export function DoctorFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  specialties,
  hospitals,
  hasActiveFilters,
  className,
}: DoctorFiltersProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [showMore, setShowMore] = React.useState(false)

  const updateFilter = (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const renderFilterChips = () => {
    const chips: React.ReactNode[] = []

    if (filters.specialty) {
      const specialty = specialties.find(s => s.id === filters.specialty)
      chips.push(
        <Badge key="specialty" variant="default" className="gap-1" onClick={() => updateFilter('specialty', undefined)}>
          <Stethoscope className="h-3 w-3" />
          {specialty?.name || filters.specialty}
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    if (filters.distance_km) {
      chips.push(
        <Badge key="distance" variant="default" className="gap-1" onClick={() => updateFilter('distance_km', undefined)}>
          <MapPin className="h-3 w-3" />
          Within {filters.distance_km} km
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    if (filters.min_rating) {
      chips.push(
        <Badge key="rating" variant="default" className="gap-1" onClick={() => updateFilter('min_rating', undefined)}>
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          {filters.min_rating}+ Rating
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    if (filters.available_today) {
      chips.push(
        <Badge key="today" variant="default" className="gap-1" onClick={() => updateFilter('available_today', false)}>
          <Calendar className="h-3 w-3" />
          Available Today
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    if (filters.available_now) {
      chips.push(
        <Badge key="now" variant="default" className="gap-1" onClick={() => updateFilter('available_now', false)}>
          <Clock className="h-3 w-3" />
          Available Now
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    if (filters.hospital_id) {
      const hospital = hospitals.find(h => h.id === filters.hospital_id)
      chips.push(
        <Badge key="hospital" variant="default" className="gap-1" onClick={() => updateFilter('hospital_id', undefined)}>
          <Building2 className="h-3 w-3" />
          {hospital?.name || filters.hospital_id}
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    if (filters.gender) {
      chips.push(
        <Badge key="gender" variant="default" className="gap-1" onClick={() => updateFilter('gender', undefined)}>
          <User className="h-3 w-3" />
          {filters.gender}
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    if (filters.language) {
      chips.push(
        <Badge key="language" variant="default" className="gap-1" onClick={() => updateFilter('language', undefined)}>
          <Languages className="h-3 w-3" />
          {filters.language}
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    if (filters.max_fee) {
      chips.push(
        <Badge key="fee" variant="default" className="gap-1" onClick={() => updateFilter('max_fee', undefined)}>
          <IndianRupee className="h-3 w-3" />
          Under ₹{filters.max_fee}
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    if (filters.min_experience) {
      chips.push(
        <Badge key="experience" variant="default" className="gap-1" onClick={() => updateFilter('min_experience', undefined)}>
          <Award className="h-3 w-3" />
          {filters.min_experience}+ Years Exp
          <X className="h-3 w-3" />
        </Badge>
      )
    }

    return chips
  }

  return (
    <div className={cn('bg-white border-b border-secondary-200', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={hasActiveFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                    {Object.values(filters).filter(v => v !== undefined && v !== null && v !== '' && v !== false).length}
                  </span>
                )}
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {expanded && (
            <div className={cn(
              'space-y-4 pt-2 transition-all duration-200',
              showMore ? 'max-h-[800px]' : 'max-h-64 overflow-hidden'
            )}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select
                    id="specialty"
                    value={filters.specialty || ''}
                    onChange={(e) => updateFilter('specialty', e.target.value || undefined)}
                    placeholder="All Specialties"
                  >
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="distance">Distance</Label>
                  <Select
                    id="distance"
                    value={filters.distance_km?.toString() || ''}
                    onChange={(e) => updateFilter('distance_km', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Any Distance"
                  >
                    {DISTANCE_FILTERS.map((d) => (
                      <option key={d.value} value={d.value.toString()}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <Select
                    id="sort"
                    value={filters.sort_by || 'best_match'}
                    onChange={(e) => updateFilter('sort_by', e.target.value as SearchFilters['sort_by'])}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hospital">Hospital</Label>
                  <Select
                    id="hospital"
                    value={filters.hospital_id || ''}
                    onChange={(e) => updateFilter('hospital_id', e.target.value || undefined)}
                    placeholder="All Hospitals"
                  >
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-2">
                  <Label htmlFor="max_fee">Consultation Fee (Max)</Label>
                  <Input
                    id="max_fee"
                    type="number"
                    placeholder="e.g., 1000"
                    value={filters.max_fee || ''}
                    onChange={(e) => updateFilter('max_fee', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="min_rating">Minimum Rating</Label>
                  <Select
                    id="min_rating"
                    value={filters.min_rating?.toString() || ''}
                    onChange={(e) => updateFilter('min_rating', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Any Rating"
                  >
                    <option value="4.5">4.5+</option>
                    <option value="4">4.0+</option>
                    <option value="3.5">3.5+</option>
                    <option value="3">3.0+</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="min_experience">Min Experience (Years)</Label>
                  <Input
                    id="min_experience"
                    type="number"
                    placeholder="e.g., 10"
                    value={filters.min_experience || ''}
                    onChange={(e) => updateFilter('min_experience', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.available_today || false}
                        onCheckedChange={(checked) => updateFilter('available_today', checked)}
                      />
                      <span className="text-sm text-secondary-700">Available Today</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.available_now || false}
                        onCheckedChange={(checked) => updateFilter('available_now', checked)}
                      />
                      <span className="text-sm text-secondary-700">Available Now</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    id="gender"
                    value={filters.gender || ''}
                    onChange={(e) => updateFilter('gender', e.target.value || undefined)}
                    placeholder="Any Gender"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    id="language"
                    value={filters.language || ''}
                    onChange={(e) => updateFilter('language', e.target.value || undefined)}
                    placeholder="Any Language"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {Object.keys(filters).length > 8 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMore(!showMore)}
                  className="w-full justify-center"
                >
                  {showMore ? 'Show Less' : 'Show More Filters'}
                </Button>
              )}
            </div>
          )}

          {hasActiveFilters && !expanded && (
            <div className="flex flex-wrap gap-2">
              {renderFilterChips()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}