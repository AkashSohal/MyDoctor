'use client'

import * as React from 'react'
import Link from 'next/link'
import { Stethoscope, Heart, Shield, MapPin, Phone, Mail, Globe, ArrowRight, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const footerLinks = {
  product: [
    { name: 'Find Doctors', href: '/doctors' },
    { name: 'Specialties', href: '/specialties' },
    { name: 'Hospitals', href: '/hospitals' },
    { name: 'How It Works', href: '/how-it-works' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/about' },
    { name: 'Blog', href: '/about' },
    { name: 'Press', href: '/about' },
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
    { name: 'Resources', href: '/about' },
  ],
}

export function Footer() {
  const [email, setEmail] = React.useState('')
  const [subscribed, setSubscribed] = React.useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  return (
    <footer className="relative bg-secondary-900 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      {/* Newsletter Section */}
      <div className="relative border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
              <p className="text-secondary-300">Get the latest health tips and doctor recommendations delivered to your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full max-w-md gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-secondary-400 focus:border-primary-400 focus:ring-primary-400"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-primary-500 to-teal-500 hover:from-primary-600 hover:to-teal-600 text-white font-medium px-6"
              >
                {subscribed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <>
                    Subscribe
                    <Send className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-5 xl:gap-8">
          {/* Brand Column */}
          <div className="xl:col-span-2 space-y-6">
            <Link href="/" className="flex items-center space-x-2.5" aria-label="MediNear Home">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-teal-500">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">MediNear</span>
            </Link>
            <p className="text-secondary-300 text-sm leading-relaxed max-w-xs">
              Find the Right Doctor Near You. Discover verified MBBS doctors, specialists, ratings, hospitals and availability — all in one place.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {[
                { name: 'Twitter', href: '#', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { name: 'Facebook', href: '#', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                { name: 'Instagram', href: '#', icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 3h11A3.5 3.5 0 0121 6.5v11a3.5 3.5 0 01-3.5 3.5h-11A3.5 3.5 0 013 17.5v-11A3.5 3.5 0 016.5 3z' },
                { name: 'LinkedIn', href: '#', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 2a2 2 0 110 4 2 2 0 010-4z' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-primary-500 hover:to-teal-500 text-secondary-300 hover:text-white transition-all duration-300"
                  aria-label={social.name}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>

            {/* Contact Info */}
            <div className="space-y-3 text-sm text-secondary-300">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary-400" />
                <span>Bangalore, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary-400" />
                <span>+91 80 1234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary-400" />
                <span>support@medinear.com</span>
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
              © {new Date().getFullYear()} MediNear. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-secondary-400">
              <Shield className="h-4 w-4 text-primary-400" />
              <span>Verified Doctors Only</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
