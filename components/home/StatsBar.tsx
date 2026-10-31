import { ShieldCheck, Building2, Stethoscope } from 'lucide-react'

export interface PlatformStats {
  verifiedDoctors?: number | null
  hospitals?: number | null
  specialties?: number | null
}

export function StatsBar({ stats }: { stats: PlatformStats | null }) {
  if (!stats) return null

  const items = [
    {
      key: 'doctors',
      label: 'Verified doctors',
      value: stats.verifiedDoctors,
      icon: ShieldCheck,
      tint: 'from-primary-500 to-teal-500',
    },
    {
      key: 'hospitals',
      label: 'Hospitals & clinics',
      value: stats.hospitals,
      icon: Building2,
      tint: 'from-sky-500 to-blue-500',
    },
    {
      key: 'specialties',
      label: 'Medical specialties',
      value: stats.specialties,
      icon: Stethoscope,
      tint: 'from-teal-500 to-emerald-500',
    },
  ].filter((item) => typeof item.value === 'number' && item.value > 0)

  if (items.length === 0) return null

  return (
    <section className="relative z-20 -mt-8">
      <div className="container">
        <div className="rounded-2xl border border-secondary-200/70 bg-white p-6 shadow-float sm:p-8">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-4">
                <span
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tint} text-white shadow-md`}
                  aria-hidden="true"
                >
                  <item.icon className="h-6 w-6" />
                </span>
                <div>
                  <dt className="text-sm font-medium text-secondary-500">{item.label}</dt>
                  <dd className="text-2xl font-bold text-secondary-900 sm:text-3xl">
                    {item.value?.toLocaleString('en-IN')}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
