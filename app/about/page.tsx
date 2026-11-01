import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TeamMemberCard } from '@/components/about/TeamMemberCard'
import { Shield, Heart, Users, Star, Lightbulb, Target, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About MyDoctor | Find the Right Doctor Near You',
  description: 'Learn about MyDoctor\'s mission to help patients find verified, highly-rated specialists with transparent information.',
}

const values = [
  {
    icon: Shield,
    title: 'Trust & Verification',
    description: 'Every doctor on MyDoctor undergoes rigorous verification of medical registration, qualifications, and credentials before they appear on our platform.',
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

type TeamMember = {
  name: string
  initials: string
  badge?: 'Team Leader' | 'Senior Guide'
}

const seniorGuide: TeamMember = {
  name: 'Prof. Netravati Sawale',
  initials: 'NS',
  badge: 'Senior Guide',
}

const team: TeamMember[] = [
  { name: 'Akashdeep Singh', initials: 'AS', badge: 'Team Leader' },
  { name: 'Simar Singh', initials: 'SS' },
  { name: 'Amrinder Kaur', initials: 'AK' },
  { name: 'Anshu Maria Zoya', initials: 'AZ' },
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
              MyDoctor was founded on a simple belief: finding the right doctor should be easy, transparent, and trustworthy. 
              We&apos;re building the platform we wished existed when we needed care.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/doctors">
                <Button size="lg">Find a Doctor</Button>
              </Link>
              <Link href="/auth/register?role=doctor">
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
                  MyDoctor exists to bridge the gap between patients and quality healthcare providers. 
                  In India&apos;s complex healthcare landscape, patients often struggle to find verified specialists, 
                  compare options, and make informed decisions.
                </p>
                <p>
                  We&apos;re changing that by creating a platform where every doctor is verified, every review is authentic, 
                  and every piece of information helps you choose with confidence.
                </p>
                <p className="font-medium text-primary-700">
                  &quot;Nearby. Verified. Trusted.&quot; &mdash; This isn&apos;t just a tagline. It&apos;s our promise to every patient.
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
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Meet Our <span className="text-gradient">Team</span>
            </h2>
            <div
              className="mx-auto mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
              aria-hidden="true"
            />
            <p className="text-lg text-secondary-600">
              Together, we are building a smarter, more accessible healthcare experience.
            </p>
          </div>

          <div className="mb-14 flex justify-center">
            <TeamMemberCard
              name={seniorGuide.name}
              initials={seniorGuide.initials}
              badge={seniorGuide.badge}
              featured
              className="w-full max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <TeamMemberCard
                key={member.name}
                name={member.name}
                initials={member.initials}
                badge={member.badge}
                className="mx-auto w-full max-w-sm sm:max-w-none"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-primary-600">
        <div className="container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Find Your Doctor?</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of patients who trust MyDoctor to find verified, highly-rated specialists near them.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/doctors">
              <Button size="lg" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-primary-50 px-8">
                Find Doctors Now
              </Button>
            </Link>
            <Link href="/auth/register?role=doctor">
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