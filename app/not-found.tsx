import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary-100 text-secondary-400">
          <Search className="h-10 w-10" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-secondary-900">Page not found</h1>
        <p className="mt-2 text-secondary-500">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full gap-2 sm:w-auto">
              <Home className="h-4 w-4" aria-hidden="true" />
              Go Home
            </Button>
          </Link>
          <Link href="/doctors" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <Search className="h-4 w-4" aria-hidden="true" />
              Find Doctors
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
