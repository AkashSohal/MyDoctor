'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SearchPanel, SearchPanelSpecialty } from './SearchPanel'
import { DoctorVisual, FeaturedDoctor } from './DoctorVisual'
import { Stethoscope, Compass, ShieldCheck } from 'lucide-react'

interface HeroSectionProps {
  specialties: SearchPanelSpecialty[]
  featuredDoctor?: FeaturedDoctor | null
}

export function HeroSection({ specialties, featuredDoctor }: HeroSectionProps) {
  const focusSearch = React.useCallback(() => {
    const input = document.getElementById('hero-doctor-search')
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (input instanceof HTMLInputElement) {
        window.setTimeout(() => input.focus({ preventScroll: true }), 350)
      }
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-teal-50">
      <div className="hero-shape hero-shape-1" aria-hidden="true" />
      <div className="hero-shape hero-shape-2" aria-hidden="true" />
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />

      <div className="container relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-primary-700 shadow-soft backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-primary-600" aria-hidden="true" />
              Verified registration details on every profile
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-secondary-900 sm:text-5xl lg:text-6xl">
              Find the Right Doctor,{' '}
              <span className="text-gradient">Right Near You.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-secondary-600 sm:text-lg">
              Discover trusted doctors and specialists near you, explore their qualifications and
              availability, and book your medical appointment with confidence.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                size="xl"
                onClick={focusSearch}
                className="gap-2 bg-gradient-to-r from-primary-600 to-teal-600 font-semibold hover:from-primary-700 hover:to-teal-700"
              >
                <Stethoscope className="h-5 w-5" aria-hidden="true" />
                Find a Doctor
              </Button>
              <Button
                size="xl"
                variant="outline"
                asChild
                className="gap-2 border-secondary-300 font-semibold"
              >
                <Link href="/specialties">
                  <Compass className="h-5 w-5 text-teal-600" aria-hidden="true" />
                  Explore Specialists
                </Link>
              </Button>
            </div>

            <SearchPanel specialties={specialties} className="mt-8" />
          </div>

          <div className="hidden lg:block">
            <DoctorVisual doctor={featuredDoctor} />
          </div>
        </div>

        <div className="mt-10 lg:hidden">
          <DoctorVisual doctor={featuredDoctor} />
        </div>
      </div>
    </section>
  )
}
