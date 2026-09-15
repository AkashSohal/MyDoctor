import { Metadata } from 'next'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, MapPin, Phone, ExternalLink, ArrowRight, Users, Star } from 'lucide-react'
import { formatDistance } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Hospitals & Clinics | MediNear',
  description: 'Find top hospitals and clinics with verified doctors. View locations, contact info, and doctor availability.',
}

export const dynamic = 'force-dynamic'

export default async function HospitalsPage() {
  const supabase = createServerClient()

  const { data: hospitals } = await supabase
    .from('hospitals')
    .select(`
      *,
      doctors:doctor_hospitals(count)
    `)
    .order('name')

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">Hospitals & Clinics</h1>
          <p className="text-lg text-secondary-600 max-w-2xl">
            Discover top healthcare facilities with verified doctors. View locations, specialties, and doctor availability.
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(hospitals || []).map((hospital) => (
            <Link key={hospital.id} href={`/hospitals/${hospital.id}`} className="group">
              <Card className="h-full hover:shadow-soft transition-shadow border-secondary-200 group-hover:border-primary-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors flex-shrink-0">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                        {hospital.name}
                      </h3>
                      <p className="text-sm text-secondary-500 mt-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {hospital.address}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-secondary-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {hospital.doctors?.[0]?.count || 0} doctors
                        </span>
                        {hospital.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {hospital.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-primary-600 font-medium text-sm group-hover:underline">
                      View details
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {(!hospitals || hospitals.length === 0) && (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <Building2 className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                <h2 className="text-xl font-semibold text-secondary-900 mb-2">No hospitals found</h2>
                <p className="text-secondary-500 mb-4">We're adding more hospitals to our network. Check back soon!</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}