'use client'

import Link from 'next/link'
import { Stethoscope, Shield, MapPin, Mail, ArrowRight } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Find Doctors', href: '/doctors' },
    { name: 'Specialties', href: '/specialties' },
    { name: 'Hospitals & Clinics', href: '/hospitals' },
    { name: 'How It Works', href: '/how-it-works' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
  ],
  support: [
    { name: 'Help Center', href: '/about' },
    { name: 'Privacy Policy', href: '/about' },
    { name: 'Terms of Service', href: '/about' },
    { name: 'Contact Us', href: '/about' },
  ],
  forDoctors: [
    { name: 'Register as Doctor', href: '/auth/register?role=doctor' },
    { name: 'Doctor Dashboard', href: '/dashboard/doctor' },
    { name: 'Verification Process', href: '/how-it-works' },
  ],
}

export function Footer() {
  return (
    <footer className="relative bg-secondary-900 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      {/* Main Footer Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-5 xl:gap-8">
          {/* Brand Column */}
          <div className="xl:col-span-2 space-y-6">
            <Link href="/" className="flex items-center space-x-2.5" aria-label="MyDoctor Home">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-teal-500">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">MyDoctor</span>
            </Link>
            <p className="text-secondary-300 text-sm leading-relaxed max-w-xs">
              Find the Right Doctor, Right Near You. Explore verified doctors and specialists,
              their qualifications and availability, and book appointments with confidence.
            </p>

            <div className="flex items-start gap-2 text-sm text-secondary-300">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
              <span>Verified badge shown only after registration details are reviewed</span>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 text-sm text-secondary-300">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary-400" />
                <span>Bangalore, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary-400" />
                <a href="mailto:support@mydoctor.com" className="hover:text-white transition-colors">
                  support@mydoctor.com
                </a>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-3 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h3>
                <ul className="mt-4 space-y-3">
                  {footerLinks.product.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-secondary-300 hover:text-white transition-colors duration-200 flex items-center gap-1 group">
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Company</h3>
                <ul className="mt-4 space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-secondary-300 hover:text-white transition-colors duration-200 flex items-center gap-1 group">
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Support</h3>
                <ul className="mt-4 space-y-3">
                  {footerLinks.support.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-secondary-300 hover:text-white transition-colors duration-200 flex items-center gap-1 group">
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">For Doctors</h3>
                <ul className="mt-4 space-y-3">
                  {footerLinks.forDoctors.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-secondary-300 hover:text-white transition-colors duration-200 flex items-center gap-1 group">
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-secondary-400">
              © {new Date().getFullYear()} MyDoctor. All rights reserved.
            </p>
            <p className="text-xs text-secondary-500 max-w-xl">
              MyDoctor is a discovery and appointment-support platform and does not provide
              medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
