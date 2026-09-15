import { Metadata } from 'next'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Stethoscope, Heart, Users, ArrowRight } from 'lucide-react'
import { SPECIALTIES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Medical Specialties | MediNear',
  description: 'Browse all medical specialties and find verified specialists near you.',
}

export const dynamic = 'force-dynamic'

export default async function SpecialtiesPage() {
  const supabase = createServerClient()

  const { data: specialtiesWithCounts } = await supabase
    .from('specialties')
    .select(`
      id,
      name,
      description,
      icon,
      doctors:doctors(count)
    `)
    .order('name')

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">Medical Specialties</h1>
          <p className="text-lg text-secondary-600 max-w-2xl">
            Find verified specialists across all major medical fields. Each doctor is verified for qualifications and registration.
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(specialtiesWithCounts || []).map((specialty) => {
            const doctorCount = specialty.doctors?.[0]?.count || 0
            return (
              <Link
                key={specialty.id}
                href={`/doctors?specialty=${specialty.id}`}
                className="group"
              >
                <Card className="h-full hover:shadow-soft transition-shadow border-secondary-200 group-hover:border-primary-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors flex-shrink-0">
                        <Stethoscope className="h-7 w-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                          {specialty.name}
                        </h3>
                        <p className="text-sm text-secondary-500 mt-1 line-clamp-2">
                          {specialty.description || 'Medical specialist'}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-sm text-secondary-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {doctorCount} doctors
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-primary-600 font-medium text-sm group-hover:underline">
                        View doctors
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-primary-50 border-primary-200 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-2">Can't find your specialty?</h2>
              <p className="text-primary-700 mb-4">We're constantly adding new specialties. Contact us if you need a specific type of specialist.</p>
              <Link href="/contact">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
                  Contact Us
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}