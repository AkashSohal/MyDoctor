'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Stethoscope, Heart, Shield, MapPin, Phone, Mail, Globe, MessageSquare, Share2, Briefcase } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Find Doctors', href: '/doctors' },
    { name: 'Specialties', href: '/specialties' },
    { name: 'Hospitals', href: '/hospitals' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Compare Doctors', href: '/doctors?compare=true' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Specialties', href: '/specialties' },
    { name: 'Hospitals', href: '/hospitals' },
  ],
  support: [
    { name: 'Help Center', href: '/about' },
    { name: 'Privacy Policy', href: '/about' },
    { name: 'Terms of Service', href: '/about' },
    { name: 'Contact', href: '/about' },
  ],
  forDoctors: [
    { name: 'Doctor Registration', href: '/auth/register?role=doctor' },
    { name: 'Doctor Dashboard', href: '/dashboard/doctor' },
    { name: 'Find Doctors', href: '/doctors' },
    { name: 'Specialties', href: '/specialties' },
  ],
}

const socialLinks = [
  { name: 'Website', href: '#', icon: Globe },
  { name: 'Message', href: '#', icon: MessageSquare },
  { name: 'Share', href: '#', icon: Share2 },
  { name: 'LinkedIn', href: '#', icon: Briefcase },
]

export function Footer() {
  return (
    <footer className="border-t border-secondary-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Link href="/" className="flex items-center space-x-2" aria-label="MediNear Home">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-secondary-900">MediNear</span>
            </Link>
            <p className="text-secondary-600 text-sm leading-relaxed max-w-xs">
              Find the Right Doctor Near You. Discover verified MBBS doctors, specialists, ratings, hospitals and availability — all in one place.
            </p>
            <div className="flex space-x-6">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  aria-label={name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-secondary-900">Product</h3>
                <ul className="mt-4 space-y-3">
                  {footerLinks.product.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-secondary-600 hover:text-secondary-900 transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-secondary-900">Company</h3>
                <ul className="mt-4 space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-secondary-600 hover:text-secondary-900 transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-secondary-900">Support</h3>
                <ul className="mt-4 space-y-3">
                  {footerLinks.support.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-secondary-600 hover:text-secondary-900 transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-secondary-900">For Doctors</h3>
                <ul className="mt-4 space-y-3">
                  {footerLinks.forDoctors.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-secondary-600 hover:text-secondary-900 transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-secondary-200 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-secondary-500">
              © {new Date().getFullYear()} MediNear. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-secondary-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Bangalore, India
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                +91 80 1234 5678
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                support@medinear.com
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary-500">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Verified Doctors Only</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}