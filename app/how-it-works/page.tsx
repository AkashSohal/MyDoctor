import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Shield, Calendar, MapPin, Star, CheckCircle, ArrowRight, Users, Clock, Stethoscope, Building2, Smartphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works | MediNear',
  description: 'Learn how to find, compare, and book appointments with verified doctors on MediNear in three simple steps.',
}

const steps = [
  {
    number: '01',
    title: 'Search & Discover',
    description: 'Enter what you\'re looking for — a symptom, specialist type, doctor name, or hospital. Use your current location or search by city, area, or pincode.',
    icon: Search,
    details: [
      'Search by specialty: "Cardiologist", "Skin specialist", "Child doctor"',
      'Search by name: "Dr. Rahul Sharma"',
      'Search by hospital: "Apollo Hospital"',
      'Use "Use My Location" for automatic detection',
      'Or manually enter city, locality, or pincode',
    ],
  },
  {
    number: '02',
    title: 'Compare & Decide',
    description: 'View comprehensive profiles with verified information. Our Best Match algorithm ranks doctors by relevance, ratings, experience, availability, and distance.',
    icon: Shield,
    details: [
      'Verified badge for authenticated doctors',
      'Qualifications, experience, and specialization',
      'Patient ratings with review counts',
      'Hospital affiliations with schedules',
      'Real-time availability (today, this week, now)',
      'Consultation fees upfront',
      'Distance from your location',
      'MediNear Match score with breakdown',
      'Side-by-side comparison of up to 3 doctors',
    ],
  },
  {
    number: '03',
    title: 'Book & Visit',
    description: 'Select a convenient time slot, provide basic details, and confirm your appointment. Get directions to the clinic or hospital.',
    icon: Calendar,
    details: [
      'Choose hospital/clinic location',
      'Pick available date and time slot',
      'Enter patient details (name, phone, age)',
      'Add optional message for the doctor',
      'Instant confirmation',
      'Get directions via Google Maps',
      'Receive appointment reminders',
      'Leave verified review after visit',
    ],
  },
]

const features = [
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Works seamlessly on phones, tablets, and desktops. No app download required.',
  },
  {
    icon: Users,
    title: 'Verified Reviews',
    description: 'Only patients with completed appointments can review. One review per appointment.',
  },
  {
    icon: Clock,
    title: 'Real-time Availability',
    description: 'See which doctors are available today, tomorrow, this week, or right now.',
  },
  {
    icon: MapPin,
    title: 'Accurate Distance',
    description: 'Real GPS-based distance calculation. No approximations or fake distances.',
  },
  {
    icon: Star,
    title: 'Smart Matching',
    description: 'Best Match algorithm considers specialty, ratings, experience, availability, and distance.',
  },
  {
    icon: Building2,
    title: 'Multi-location Doctors',
    description: 'Many doctors work at multiple hospitals. See all locations with specific schedules.',
  },
]

const faqs = [
  {
    q: 'Is MediNear free to use?',
    a: 'Yes, MediNear is completely free for patients. We don\'t charge for searching, comparing, or booking appointments.',
  },
  {
    q: 'How are doctors verified?',
    a: 'Every doctor submits their medical registration number, council, qualifications, and documents. Our admin team verifies each profile before it goes live.',
  },
  {
    q: 'Can I trust the ratings?',
    a: 'Absolutely. Only verified patients who completed appointments can leave reviews. We prevent fake reviews through strict verification and have moderation for reported reviews.',
  },
  {
    q: 'Do I need to create an account to search?',
    a: 'No, you can search and view doctor profiles without an account. You only need an account to book appointments, save doctors, or leave reviews.',
  },
  {
    q: 'What if a doctor\'s availability changes?',
    a: 'Doctors manage their own schedules. We recommend confirming the appointment time with the clinic/hospital before visiting, as schedules can change.',
  },
  {
    q: 'Can I book for a family member?',
    a: 'Yes, during booking you can enter the patient\'s name and details. The appointment will be under their name.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 via-white to-secondary-50 py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              Simple 3-Step Process
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-secondary-900 tracking-tight mb-6">
              How MediNear{' '}
              <span className="text-gradient">Works</span>
            </h1>
            <p className="text-lg sm:text-xl text-secondary-600 mb-8">
              Find, compare, and book the right doctor in minutes — not hours.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="section bg-white">
        <div className="container">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div 
                key={step.number} 
                className={`flex flex-col lg:flex-row gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 text-2xl font-bold mb-6 mx-auto lg:mx-0">
                    {step.number}
                  </div>
                  <h2 className="text-3xl font-bold text-secondary-900 mb-4">{step.title}</h2>
                  <p className="text-lg text-secondary-600 mb-6">{step.description}</p>
                  <ul className="space-y-3 text-left max-w-lg mx-auto lg:mx-0">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3 text-secondary-700">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="aspect-video rounded-2xl bg-secondary-100 flex items-center justify-center">
                    <div className="text-center p-8">
                      <step.icon className="mx-auto h-16 w-16 text-primary-200 mb-4" />
                      <p className="text-secondary-500">Step {step.number} illustration</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="section bg-secondary-50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">Why Patients Choose MediNear</h2>
            <p className="text-lg text-secondary-600">Built for how you actually search for healthcare</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
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

      {/* FAQ */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-secondary-600">Everything you need to know about using MediNear</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-secondary-200 rounded-xl overflow-hidden bg-white">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-medium text-secondary-900 pr-4">{faq.q}</span>
                  <ArrowRight className="h-5 w-5 text-secondary-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-5 pb-5 text-secondary-600 border-t border-secondary-200">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-primary-600">
        <div className="container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Find your doctor today. It\'s free, fast, and trusted by thousands of patients.
          </p>
          <Link href="/doctors">
            <Button size="lg" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-primary-50 px-8">
              Find Doctors Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}