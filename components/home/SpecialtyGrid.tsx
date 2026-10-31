import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SpecialtyCardItem } from './specialtyCards'

interface SpecialtyGridProps {
  items: SpecialtyCardItem[]
}

export function SpecialtyGrid({ items }: SpecialtyGridProps) {
  return (
    <section id="specialties" className="section bg-mesh">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700">
              Specialties
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">
              Browse Medical Specialties
            </h2>
            <p className="mt-2 max-w-2xl text-secondary-600">
              Pick a specialty to see verified doctors, their qualifications, fees, and schedules.
            </p>
          </div>
          <Link
            href="/specialties"
            className="inline-flex shrink-0 items-center gap-2 font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            View all specialties
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="group flex h-full flex-col items-center rounded-2xl border border-secondary-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:bg-primary-50 hover:shadow-glow"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-teal-100 text-primary-600 transition-all duration-300 group-hover:from-primary-500 group-hover:to-teal-500 group-hover:text-white">
                  <item.icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <span className="mt-3 text-sm font-medium text-secondary-900 transition-colors group-hover:text-primary-600">
                  {item.name}
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="mt-1 text-xs text-secondary-500">
                    {item.count} {item.count === 1 ? 'doctor' : 'doctors'}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
