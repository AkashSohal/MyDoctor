import Link from 'next/link'
import { ShieldCheck, MessageSquareHeart, ReceiptIndianRupee, MapPin, ArrowRight } from 'lucide-react'

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Verification you can check',
    description:
      'A Verified badge appears only after the platform reviews a doctor’s medical registration number and council. Pending profiles stay clearly marked.',
  },
  {
    icon: MessageSquareHeart,
    title: 'Reviews from real patients',
    description:
      'Only patients with a completed appointment can leave a review, and reviews pass moderation before they are published.',
  },
  {
    icon: ReceiptIndianRupee,
    title: 'Fees and schedules upfront',
    description:
      'Every profile lists consultation fees, qualifications, hospital affiliations, and the doctor’s published weekly schedule.',
  },
  {
    icon: MapPin,
    title: 'Distance when you share location',
    description:
      'Turn on location to see how far each doctor and clinic is from you. Distances are calculated, never guessed.',
  },
]

export function TrustSection() {
  return (
    <section className="section bg-secondary-50">
      <div className="container">
        <div className="mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700">
            Why MyDoctor
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">
            Built for informed healthcare decisions
          </h2>
          <p className="mt-3 text-secondary-600">
            MyDoctor is a discovery and booking platform. Here is exactly what we show — and how
            each piece of information gets on your screen.
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <li
              key={benefit.title}
              className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-teal-100 text-primary-600">
                <benefit.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-secondary-900">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-600">{benefit.description}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            Learn how MyDoctor works
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
