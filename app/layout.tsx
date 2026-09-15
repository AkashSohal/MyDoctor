import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'MediNear - Find the Right Doctor Near You',
  description: 'Discover verified MBBS doctors, specialists, ratings, hospitals and availability — all in one place.',
  keywords: ['doctor', 'healthcare', 'medical', 'appointment', 'specialist', 'hospital', 'clinic'],
  authors: [{ name: 'MediNear' }],
  creator: 'MediNear',
  publisher: 'MediNear',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://medinear.com',
    title: 'MediNear - Find the Right Doctor Near You',
    description: 'Discover verified MBBS doctors, specialists, ratings, hospitals and availability — all in one place.',
    siteName: 'MediNear',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MediNear - Find the Right Doctor Near You',
    description: 'Discover verified MBBS doctors, specialists, ratings, hospitals and availability.',
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-secondary-50 font-sans text-secondary-900 flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}