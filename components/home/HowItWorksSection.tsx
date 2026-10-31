import Link from 'next/link'
import { Search, Scale, CalendarCheck, ArrowRight } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Search,
    title: 'Search',
    description:
      'Enter a location, specialty, or doctor name. Use My Location to sort by distance from where you are.',
    href: '/doctors',
    hrefLabel: 'Start searching',
  },
  {
    step: '02',
    icon: Scale,
    title: 'Compare',
    description:
      'Open profiles to check verified registration, qualifications, experience, fees, hospitals, and schedules side by side.',
    href: '/specialties',
    hrefLabel: 'Compare specialties',
  },
  {
    step: '03',
    icon: CalendarCheck,
    title: 'Book',
    description:
      'Pick an available date and time, sign in, and send your appointment request. You will see the real booking status.',
    href: '/how-it-works',
    hrefLabel: 'See the full flow',
  },
]

export function HowItWorksSection() {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700">
            Simple process
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-secondary-600">
            Three steps from search to a confirmed appointment.
          </p>
        </div>

        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <li
              key={item.step}
              className="relative rounded-2xl border border-secondary-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
            >
              <span
                className="pointer-events-none absolute right-5 top-4 text-6xl font-bold text-secondary-100"
                aria-hidden="true"
              >
                {item.step}
              </span>
              <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-teal-500 text-white shadow-md">
                <item.icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="relative mt-5 text-xl font-semibold text-secondary-900">{item.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-secondary-600">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                {item.hrefLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
