import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Compass } from 'lucide-react'

export function FinalCtaSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-teal-600 p-8 md:p-14">
          <div className="absolute inset-0 bg-grid opacity-10" aria-hidden="true" />
          <div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Find Your Doctor Today
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-100">
              Search the MyDoctor directory by specialty, location, or name — then book an
              appointment time that works for you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="xl"
                asChild
                className="w-full gap-2 bg-white font-semibold text-primary-700 shadow-lg hover:bg-primary-50 sm:w-auto"
              >
                <Link href="/doctors">
                  <Search className="h-5 w-5" aria-hidden="true" />
                  Find a Doctor
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                asChild
                className="w-full gap-2 border-2 border-white/40 font-semibold text-white hover:bg-white/10 sm:w-auto"
              >
                <Link href="/specialties">
                  <Compass className="h-5 w-5" aria-hidden="true" />
                  Explore Specialists
                </Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-primary-200">
              MyDoctor is a discovery and appointment-support platform. Please verify credentials
              and availability with the doctor or hospital before visiting.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
