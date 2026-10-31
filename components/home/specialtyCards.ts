import {
  Stethoscope,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Baby,
  Bone,
  HeartHandshake,
  Smile,
  Brain,
  Ear,
  Eye,
  ScanFace,
  type LucideIcon,
} from 'lucide-react'

export interface SpecialtyRow {
  id: string
  name: string
  doctorCount?: number
}

export interface SpecialtyCardItem {
  key: string
  name: string
  icon: LucideIcon
  href: string
  count?: number
}

interface SpecialtyCardDef {
  key: string
  name: string
  icon: LucideIcon
  /** Names in the specialties table this card should match (slug-compared). */
  matches: string[]
  /** When set, the card links to a text search instead of a specialty filter. */
  searchQuery?: string
}

/**
 * The homepage specialty line-up. Cards resolve against the live specialties
 * table so every link points at a real filter; unmatched cards fall back to the
 * specialties directory instead of a dead filter.
 */
export const HOMEPAGE_SPECIALTIES: SpecialtyCardDef[] = [
  { key: 'general-physician', name: 'General Physician', icon: Stethoscope, matches: ['General Physician', 'MBBS'] },
  { key: 'mbbs-doctor', name: 'MBBS Doctor', icon: GraduationCap, matches: ['MBBS Doctor'], searchQuery: 'MBBS' },
  { key: 'cardiologist', name: 'Cardiologist', icon: HeartPulse, matches: ['Cardiologist'] },
  { key: 'dermatologist', name: 'Dermatologist', icon: Sparkles, matches: ['Dermatologist', 'Skin Specialist'] },
  { key: 'pediatrician', name: 'Pediatrician', icon: Baby, matches: ['Pediatrician', 'Pediatrics', 'Child Specialist'] },
  { key: 'orthopedic', name: 'Orthopedic Specialist', icon: Bone, matches: ['Orthopedic', 'Orthopedic Specialist', 'Orthopedics'] },
  { key: 'gynecologist', name: 'Gynecologist', icon: HeartHandshake, matches: ['Gynecologist', 'Gynaecologist', 'Obstetrician'] },
  { key: 'dentist', name: 'Dentist', icon: Smile, matches: ['Dentist', 'Dental'] },
  { key: 'neurologist', name: 'Neurologist', icon: Brain, matches: ['Neurologist'] },
  { key: 'ent-specialist', name: 'ENT Specialist', icon: Ear, matches: ['ENT Specialist', 'ENT', 'Otorhinolaryngologist'] },
  { key: 'ophthalmologist', name: 'Ophthalmologist', icon: Eye, matches: ['Ophthalmologist', 'Eye Specialist'] },
  { key: 'psychiatrist', name: 'Psychiatrist', icon: ScanFace, matches: ['Psychiatrist'] },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Build homepage specialty cards from the live specialties table.
 * - Matches real specialties by name so `/doctors?specialty=<id>` filters work.
 * - "MBBS Doctor" links to a qualification text search.
 * - Anything not present in the database links to /specialties (never a dead filter).
 */
export function buildSpecialtyCards(rows: SpecialtyRow[]): SpecialtyCardItem[] {
  const bySlug = new Map(rows.map((row) => [slugify(row.name), row]))

  return HOMEPAGE_SPECIALTIES.map((def) => {
    for (const match of def.matches) {
      const row = bySlug.get(slugify(match))
      if (row) {
        return {
          key: def.key,
          name: def.name,
          icon: def.icon,
          href: `/doctors?specialty=${encodeURIComponent(row.id)}`,
          count: row.doctorCount,
        }
      }
    }

    if (def.searchQuery) {
      return {
        key: def.key,
        name: def.name,
        icon: def.icon,
        href: `/doctors?q=${encodeURIComponent(def.searchQuery)}`,
      }
    }

    return {
      key: def.key,
      name: def.name,
      icon: def.icon,
      href: '/specialties',
    }
  })
}
