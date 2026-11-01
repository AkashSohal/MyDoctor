import Link from 'next/link'
import { Building2, ArrowRight } from 'lucide-react'

export default function HospitalNotFound() {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-secondary-200 p-8 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">Hospital not found</h1>
          <p className="text-secondary-500 mb-6">
            The hospital you are looking for does not exist, has been removed, or the link
            is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/hospitals"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
            >
              Browse all hospitals
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-secondary-300 text-secondary-700 font-medium hover:bg-secondary-50 transition-colors"
            >
              Browse doctors
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
