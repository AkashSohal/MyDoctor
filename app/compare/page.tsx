import { Metadata } from 'next'
import { CompareClient } from './CompareClient'

export const metadata: Metadata = {
  title: 'Compare Doctors | MyDoctor',
  description:
    'Compare verified doctors side by side — specialization, qualifications, experience, ratings, fees, distance and availability.',
}

export default function ComparePage() {
  return <CompareClient />
}
