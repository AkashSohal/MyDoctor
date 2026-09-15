import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Heart, Users, Star, Lightbulb, Target, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About MediNear | Find the Right Doctor Near You',
  description: 'Learn about MediNear\'s mission to help patients find verified, highly-rated specialists with transparent information.',
}

const values = [
  {
    icon: Shield,
    title: 'Trust & Verification',
    description: 'Every doctor on MediNear undergoes rigorous verification of medical registration, qualifications, and credentials before they appear on our platform.',
  },
  {
    icon: Heart,
    title: 'Patient First',
    description: 'We prioritize patient needs above all. No paid promotions influence our search rankings. Our Best Match algorithm serves patients, not advertisers.',
  },
  {
    icon: Users,
    title: 'Real Reviews Only',
    description: 'Only verified patients who completed appointments can leave reviews. We prevent fake reviews through strict verification and moderation.',
  },
  {
    icon: Star,
    title: 'Quality Over Quantity',
    description: 'We consider review count alongside ratings. A 4.8 rating from 500 reviews ranks higher than 5.0 from 2 reviews. Quality matters.',
  },
  {
    icon: Lightbulb,
    title: 'Transparency',
    description: 'Full disclosure of consultation fees, hospital affiliations, availability schedules, and doctor qualifications. No hidden surprises.',
  },
  {
    icon: Target,
    title: 'Smart Matching',
    description: 'Our algorithm weighs specialty relevance (30%), patient ratings (20%), verification (15%), experience (15%), availability (10%), and distance (10%).',
  },
]

const team = [
  { name: 'Dr. Priya Sharma', role: 'Chief Medical Officer', bio: '15+ years clinical experience. MBBS, MD (Internal Medicine). Passionate about patient-centered care.' },
  { name: 'Rahul Gupta', role: 'CEO & Co-founder', bio: 'Former product lead at major health tech startup. MBA from IIM. Building accessible healthcare for all.' },
  { name: 'Anita Desai', role: 'CTO & Co-founder', bio: 'Ex-Google engineer. MS Computer Science. Architect of scalable health platforms serving millions.' },
  { name: 'Dr. Vikram Patel', role: 'Medical Advisory Board', bio: 'Renowned cardiologist. Padma Shri awardee. Committed to ethical healthcare standards.' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 via-white to-secondary-50 py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              Our Story
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-secondary-900 tracking-tight mb-6">
              Making Healthcare{' '}
              <span className="text-gradient">Accessible & Transparent</span>
            </h1>
            <p className="text-lg sm:text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
              MediNear was founded on a simple belief: finding the right doctor should be easy, transparent, and trustworthy. 
              We're building the platform we wished existed when we needed care.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/doctors">
                <Button size="lg">Find a Doctor</Button>
              </Link>
              <Link href="/doctor/register">
                <Button size="lg" variant="outline">Join as a Doctor</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-secondary-900 mb-6">Our Mission</h2>
              <div className="space-y-4 text-lg text-secondary-600">
                <p>
                  MediNear exists to bridge the gap between patients and quality healthcare providers. 
                  In India's complex healthcare landscape, patients often struggle to find verified specialists, 
                  compare options, and make informed decisions.
                </p>
                <p>
                  We're changing that by creating a platform where every doctor is verified, every review is authentic, 
                  and every piece of information helps you choose with confidence.
                </p>
                <p className="font-medium text-primary-700">
                  "Nearby. Verified. Trusted." — This isn't just a tagline. It's our promise to every patient.
                </p>
              </div>
            </div>
            <div className="bg-primary-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-primary-900 mb-4">What Makes Us Different</h3>
              <ul className="space-y-3 text-primary-700">
                <li className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  100% verified doctor profiles
                </li>
                <li className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  Zero paid promotion in rankings
                </li>
                <li className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  Verified patient reviews only
                </li>
                <li className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  Transparent matching algorithm
                </li>
                <li className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  Patient-first design philosophy
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-secondary-50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-secondary-600">These principles guide every decision we make</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="h-full">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4">
                    <value.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">{value.title}</h3>
                  <p className="text-secondary-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-secondary-600">Healthcare professionals and technologists united by a common mission</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 text-primary-600 text-2xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-semibold text-secondary-900">{member.name}</h3>
                  <p className="text-primary-600 text-sm mb-2">{member.role}</p>
                  <p className="text-secondary-500 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-primary-600">
        <div className="container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Find Your Doctor?</h2>
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
        </div>
      </section>
    </div>
  )
}