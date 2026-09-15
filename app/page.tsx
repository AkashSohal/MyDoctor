'use client'

import * as React from 'react'
import Link from 'next/link'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { SearchBar } from '@/components/common/SearchBar'
import { 
  Stethoscope, 
  MapPin, 
  Heart, 
  Building2, 
  Shield, 
  Star, 
  Clock, 
  Users,
  CheckCircle,
  ArrowRight,
  Calendar,
  Search,
  Loader2
} from 'lucide-react'
import { EXAMPLE_SEARCHES, SPECIALTIES } from '@/lib/constants'

const stats = [
  { label: 'Verified Doctors', value: '2,500+', icon: Shield },
  { label: 'Specialties', value: '17', icon: Stethoscope },
  { label: 'Hospitals', value: '150+', icon: Building2 },
  { label: 'Patient Reviews', value: '50,000+', icon: Star },
]

const features = [
  {
    icon: Shield,
    title: 'Verified Doctors Only',
    description: 'Every doctor is verified for medical registration, qualifications, and credentials before they appear on MediNear.',
  },
  {
    icon: Star,
    title: 'Real Patient Reviews',
    description: 'Only verified patients who completed appointments can leave reviews. No fake ratings or paid promotions.',
  },
  {
    icon: MapPin,
    title: 'Accurate Distance',
    description: 'Real-time distance calculation using your location. See exactly how far each doctor is from you.',
  },
  {
    icon: Clock,
    title: 'Real-time Availability',
    description: 'See which doctors are available today, this week, or right now. Book appointments with confidence.',
  },
  {
    icon: Building2,
    title: 'Multiple Hospital Affiliations',
    description: 'Doctors often work at multiple locations. See all hospitals and clinics with their specific schedules.',
  },
  {
    icon: Users,
    title: 'Smart Matching',
    description: 'Our Best Match algorithm considers specialty, ratings, experience, availability, and distance.',
  },
]

const popularSpecialties = SPECIALTIES.slice(0, 8)

export default function HomePage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searching, setSearching] = React.useState(false)
  const { latitude, longitude, getCurrentPosition } = useGeolocation()

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearching(true)
      const params = new URLSearchParams({ q: searchQuery })
      if (latitude && longitude) {
        params.set('lat', latitude.toString())
        params.set('lng', longitude.toString())
      }
      window.location.href = `/doctors?${params.toString()}`
    }
  }

  const handleUseLocation = () => {
    getCurrentPosition()
  }

  const handleExampleSearch = (query: string) => {
    setSearchQuery(query)
    setSearching(true)
    const params = new URLSearchParams({ q: query })
    if (latitude && longitude) {
      params.set('lat', latitude.toString())
      params.set('lng', longitude.toString())
    }
    window.location.href = `/doctors?${params.toString()}`
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-secondary-50 py-16 sm:py-24 lg:py-32">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              <CheckCircle className="h-4 w-4" />
              Trusted by 100,000+ patients
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-secondary-900 tracking-tight mb-6">
              Find the Right Doctor{' '}
              <span className="text-gradient">Near You</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-secondary-600 mb-10 max-w-2xl mx-auto">
              Discover verified MBBS doctors, specialists, ratings, hospitals and availability — all in one place.
            </p>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              location={latitude && longitude ? { lat: latitude, lng: longitude } : null}
              onUseLocation={handleUseLocation}
              loading={searching}
            />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-secondary-500">
              <span>Popular searches:</span>
              {EXAMPLE_SEARCHES.slice(0, 4).map((search) => (
                <button
                  key={search}
                  onClick={() => handleExampleSearch(search)}
                  className="px-3 py-1.5 rounded-full bg-white border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 text-secondary-600 hover:text-primary-700 transition-colors whitespace-nowrap"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-100/50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-100/50 blur-3xl" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-secondary-200">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 text-primary-600 mb-4">
                  <stat.icon className="h-7 w-7" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-secondary-900">{stat.value}</div>
                <div className="text-sm text-secondary-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-secondary-50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose MediNear?
            </h2>
            <p className="text-lg text-secondary-600">
              We help you make informed healthcare decisions with verified information and smart matching.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-soft transition-shadow h-full">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">{feature.title}</h3>
                  <p className="text-secondary-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Specialties */}
      <section className="section bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-secondary-900">Browse by Specialty</h2>
              <p className="text-secondary-600 mt-1">Find the right specialist for your needs</p>
            </div>
            <Link href="/specialties" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all specialties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            {popularSpecialties.map((specialty) => (
              <Link
                key={specialty.id}
                href={`/doctors?specialty=${specialty.id}`}
                className="group p-4 rounded-xl border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 text-primary-600 mb-3 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <h3 className="font-medium text-secondary-900 group-hover:text-primary-600 transition-colors">{specialty.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-secondary-50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-secondary-600">
              Find and book the right doctor in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search & Discover',
                description: 'Enter your symptom, specialist type, or doctor name. Use your location or search by area.',
                icon: Search,
              },
              {
                step: '02',
                title: 'Compare & Decide',
                description: 'View verified profiles, ratings, reviews, hospital affiliations, availability, and fees. Use our Best Match ranking.',
                icon: Shield,
              },
              {
                step: '03',
                title: 'Book & Visit',
                description: 'Select a convenient time slot, book your appointment, and get directions to the clinic or hospital.',
                icon: Calendar,
              },
            ].map((step) => (
              <Card key={step.step} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 text-secondary-100 text-6xl font-bold">{step.step}</div>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 text-primary-600 mb-4">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">{step.title}</h3>
                  <p className="text-secondary-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
              Learn more about how it works
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section bg-white">
        <div className="container">
          <Card className="bg-primary-600 border-primary-600">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Find Your Doctor?
              </h2>
              <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of patients who trust MediNear to find verified, highly-rated specialists near them.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/doctors">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-primary-50 px-8">
                    Find Doctors Now
                  </Button>
                </Link>
                <Link href="/doctor/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-primary-700 px-8">
                    Are You a Doctor?
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-primary-200 text-sm">
                MediNear is a discovery platform. Please verify credentials and availability with the doctor/hospital before visiting.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="py-8 bg-secondary-100 border-t border-secondary-200">
        <div className="container">
          <p className="text-sm text-secondary-600 text-center max-w-4xl mx-auto">
            <strong className="text-secondary-900">Medical Disclaimer:</strong> MediNear helps patients discover and compare healthcare providers. 
            Ratings and information are provided for informational purposes only. Please verify doctor credentials, availability, 
            and consultation details with the doctor or hospital before visiting. MediNear does not provide medical advice, diagnosis, or treatment.
          </p>
        </div>
      </section>
    </div>
  )
}