'use client'

import * as React from 'react'
import Link from 'next/link'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SearchBar } from '@/components/common/SearchBar'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { 
  Stethoscope, MapPin, Heart, Building2, Shield, Star, Clock, Users,
  CheckCircle, ArrowRight, Calendar, Search, Sparkles, TrendingUp,
  ChevronRight, Quote, Award, Zap, Target
} from 'lucide-react'
import { EXAMPLE_SEARCHES, SPECIALTIES } from '@/lib/constants'

const stats = [
  { label: 'Verified Doctors', value: '2,500+', icon: Shield, color: 'from-primary-500 to-teal-500' },
  { label: 'Specialties', value: '17', icon: Stethoscope, color: 'from-blue-500 to-indigo-500' },
  { label: 'Hospitals', value: '150+', icon: Building2, color: 'from-purple-500 to-pink-500' },
  { label: 'Patient Reviews', value: '50,000+', icon: Star, color: 'from-amber-500 to-orange-500' },
]

const features = [
  {
    icon: Shield,
    title: 'Verified Doctors Only',
    description: 'Every doctor is verified for medical registration, qualifications, and credentials before they appear on MediNear.',
    gradient: 'from-primary-500 to-teal-500',
  },
  {
    icon: Star,
    title: 'Real Patient Reviews',
    description: 'Only verified patients who completed appointments can leave reviews. No fake ratings or paid promotions.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: MapPin,
    title: 'Accurate Distance',
    description: 'Real-time distance calculation using your location. See exactly how far each doctor is from you.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Clock,
    title: 'Real-time Availability',
    description: 'See which doctors are available today, this week, or right now. Book appointments with confidence.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Building2,
    title: 'Multiple Hospital Affiliations',
    description: 'Doctors often work at multiple locations. See all hospitals and clinics with their specific schedules.',
    gradient: 'from-rose-500 to-red-500',
  },
  {
    icon: Users,
    title: 'Smart Matching',
    description: 'Our Best Match algorithm considers specialty, ratings, experience, availability, and distance.',
    gradient: 'from-indigo-500 to-violet-500',
  },
]

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Patient',
    content: 'Found a great cardiologist near my office. The booking was seamless and the doctor was excellent!',
    rating: 5,
    avatar: 'PS',
  },
  {
    name: 'Rahul Mehta',
    role: 'Patient',
    content: 'MediNear helped me find a pediatrician for my daughter. The real patient reviews were very helpful.',
    rating: 5,
    avatar: 'RM',
  },
  {
    name: 'Anita Patel',
    role: 'Patient',
    content: 'Love how I can see which doctors are available right now. Saved me so much time during an emergency.',
    rating: 5,
    avatar: 'AP',
  },
]

const popularSpecialties = SPECIALTIES.slice(0, 8)

const specialtyIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'general-physician': Stethoscope,
  'cardiologist': Heart,
  'dermatologist': Sparkles,
  'orthopedic': Target,
  'pediatrician': Users,
  'gynecologist': Heart,
  'ent-specialist': Stethoscope,
  'neurologist': Zap,
}

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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-teal-50 py-20 sm:py-28 lg:py-36">
        {/* Animated background shapes */}
        <div className="hero-shape hero-shape-1" />
        <div className="hero-shape hero-shape-2" />
        <div className="hero-shape hero-shape-3" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid opacity-50" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary-200 text-primary-700 text-sm font-medium mb-8 shadow-soft">
                <CheckCircle className="h-4 w-4 text-primary-500" />
                Trusted by 100,000+ patients across India
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-secondary-900 tracking-tight mb-6 leading-tight">
                Find the Right Doctor{' '}
                <span className="text-gradient">Near You</span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <p className="text-lg sm:text-xl text-secondary-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Discover verified MBBS doctors, specialists, ratings, hospitals and availability — all in one place.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="max-w-2xl mx-auto">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSearch={handleSearch}
                  location={latitude && longitude ? { lat: latitude, lng: longitude } : null}
                  onUseLocation={handleUseLocation}
                  loading={searching}
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-secondary-500">
                <span className="font-medium">Popular searches:</span>
                {EXAMPLE_SEARCHES.slice(0, 4).map((search) => (
                  <button
                    key={search}
                    onClick={() => handleExampleSearch(search)}
                    className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 text-secondary-600 hover:text-primary-700 transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-glow"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-8 z-20">
        <div className="container">
          <ScrollReveal>
            <div className="bg-white rounded-2xl shadow-float p-6 sm:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="text-center group">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <stat.icon className="h-7 w-7" />
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-secondary-900">{stat.value}</div>
                    <div className="text-sm text-secondary-500 mt-1 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-white mt-12">
        <div className="container">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                Why MediNear
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
                Why Choose MediNear?
              </h2>
              <p className="text-lg text-secondary-600">
                We help you make informed healthcare decisions with verified information and smart matching.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <Card className="h-full card-interactive card-glow group cursor-default">
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">{feature.title}</h3>
                    <p className="text-secondary-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Specialties */}
      <section className="section bg-mesh">
        <div className="container">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
                  <Stethoscope className="h-4 w-4" />
                  Specialties
                </div>
                <h2 className="text-3xl font-bold text-secondary-900">Browse by Specialty</h2>
                <p className="text-secondary-600 mt-1">Find the right specialist for your needs</p>
              </div>
              <Link href="/specialties" className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            {popularSpecialties.map((specialty, index) => {
              const IconComponent = specialtyIcons[specialty.id] || Stethoscope
              return (
                <ScrollReveal key={specialty.id} delay={index * 50}>
                  <Link
                    href={`/doctors?specialty=${specialty.id}`}
                    className="group p-5 rounded-2xl bg-white border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-300 text-center shadow-sm hover:shadow-glow card-interactive"
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-teal-100 text-primary-600 mb-3 group-hover:from-primary-500 group-hover:to-teal-500 group-hover:text-white transition-all duration-300">
                      <IconComponent className="h-7 w-7" />
                    </div>
                    <h3 className="font-medium text-secondary-900 group-hover:text-primary-600 transition-colors text-sm">{specialty.name}</h3>
                  </Link>
                </ScrollReveal>
              )
            })}
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Link href="/specialties" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
              View all specialties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-white">
        <div className="container">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
                <Zap className="h-4 w-4" />
                Simple Process
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-secondary-600">
                Find and book the right doctor in three simple steps
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary-200 via-teal-200 to-primary-200" />
            
            {[
              {
                step: '01',
                title: 'Search & Discover',
                description: 'Enter your symptom, specialist type, or doctor name. Use your location or search by area.',
                icon: Search,
                gradient: 'from-primary-500 to-teal-500',
              },
              {
                step: '02',
                title: 'Compare & Decide',
                description: 'View verified profiles, ratings, reviews, hospital affiliations, availability, and fees.',
                icon: Shield,
                gradient: 'from-blue-500 to-indigo-500',
              },
              {
                step: '03',
                title: 'Book & Visit',
                description: 'Select a convenient time slot, book your appointment, and get directions to the clinic.',
                icon: Calendar,
                gradient: 'from-purple-500 to-pink-500',
              },
            ].map((step, index) => (
              <ScrollReveal key={step.step} delay={index * 150}>
                <div className="relative">
                  <Card className="relative overflow-hidden card-interactive group">
                    <CardContent className="p-8">
                      <div className="absolute top-6 right-6 text-7xl font-bold text-secondary-100 group-hover:text-primary-100 transition-colors duration-300">
                        {step.step}
                      </div>
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg relative z-10`}>
                        <step.icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-semibold text-secondary-900 mb-3 relative z-10">{step.title}</h3>
                      <p className="text-secondary-600 leading-relaxed relative z-10">{step.description}</p>
                    </CardContent>
                  </Card>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <div className="text-center mt-12">
              <Link href="/how-it-works" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors">
                Learn more about how it works
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-mesh">
        <div className="container">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
                <Quote className="h-4 w-4" />
                Testimonials
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
                What Our Patients Say
              </h2>
              <p className="text-lg text-secondary-600">
                Thousands of patients trust MediNear for their healthcare needs
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={testimonial.name} delay={index * 100}>
                <Card className="h-full card-interactive">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-secondary-600 mb-6 leading-relaxed italic">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-secondary-900">{testimonial.name}</div>
                        <div className="text-sm text-secondary-500">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-teal-600 p-8 md:p-14">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-grid opacity-10" />
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-500/20 blur-3xl" />
              
              <div className="relative z-10 text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Ready to Find Your Doctor?
                </h2>
                <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
                  Join thousands of patients who trust MediNear to find verified, highly-rated specialists near them.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/doctors">
                    <Button size="lg" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-primary-50 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 btn-shine">
                      Find Doctors Now
                    </Button>
                  </Link>
                  <Link href="/doctor/onboarding">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 px-10 py-6 text-lg font-semibold transition-all duration-300">
                      Are You a Doctor?
                    </Button>
                  </Link>
                </div>
                <p className="mt-8 text-primary-200 text-sm">
                  MediNear is a discovery platform. Please verify credentials and availability with the doctor/hospital before visiting.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="py-8 bg-secondary-100 border-t border-secondary-200">
        <div className="container">
          <p className="text-sm text-secondary-600 text-center max-w-4xl mx-auto leading-relaxed">
            <strong className="text-secondary-900">Medical Disclaimer:</strong> MediNear helps patients discover and compare healthcare providers. 
            Ratings and information are provided for informational purposes only. Please verify doctor credentials, availability, 
            and consultation details with the doctor or hospital before visiting. MediNear does not provide medical advice, diagnosis, or treatment.
          </p>
        </div>
      </section>
    </div>
  )
}
