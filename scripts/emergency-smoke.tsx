/**
 * Emergency module smoke test (Parts 1 & 2).
 *
 * Runs with: npm run smoke:emergency
 * Renders the emergency components server-side and asserts the safety-critical
 * copy, call targets and helper behaviour — nothing here dials a number.
 */
import * as React from 'react'
import { renderToString } from 'react-dom/server'

import {
  AMBULANCE_NUMBER,
  EMERGENCY_SERVICES_NUMBER,
  buildDirectionsUrl,
  buildMapsUrl,
  buildShareText,
  buildSmsHref,
  buildTelHref,
  dialNumber,
  isValidPhone,
} from '../lib/emergency'
import { emergencyInfo, haversineKm, type PublicHospital } from '../lib/hospitals/list'
import { CallConfirmDialog } from '../components/emergency/CallConfirmDialog'
import { SosButton } from '../components/emergency/SosButton'
import { EmergencyCallActions, EmergencyContactCallButton } from '../components/emergency/CallButtons'
import { NearbyEmergencyHospitals } from '../components/emergency/NearbyEmergencyHospitals'
import { EmergencyContactsSection } from '../components/emergency/EmergencyContactsSection'
import { ShareLocationDialog } from '../components/emergency/ShareLocationDialog'
import { LocationShare } from '../components/emergency/LocationShare'
import { MedicalInfoSection } from '../components/emergency/MedicalInfoSection'
import { MedicalIdSection } from '../components/emergency/MedicalIdSection'
import { SharedMedicalIdCard } from '../components/emergency/SharedMedicalIdCard'
import { FirstAidGuide } from '../components/emergency/FirstAidGuide'
import { EmergencyDashboard } from '../components/emergency/EmergencyDashboard'
import { useEmergencyContacts, useEmergencyMedicalInfo } from '../lib/emergency/storage'
import { useEmergencyProfile } from '../lib/emergency/useEmergencyProfile'
import {
  buildSharePayload,
  createShareToken,
  SHARE_TOKEN_PATTERN,
} from '../lib/emergency/medicalId'
import {
  EMPTY_EMERGENCY_PROFILE,
  hasEmergencyProfileContent,
  validateEmergencyProfile,
  type EmergencyProfile,
} from '../lib/emergency/profile'

let passed = 0
let failed = 0

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

function render(label: string, element: React.ReactElement, mustContain: string[]) {
  try {
    const html = renderToString(element)
    for (const needle of mustContain) {
      check(`${label}: contains "${needle}"`, html.includes(needle))
    }
  } catch (error) {
    failed += mustContain.length || 1
    console.log(`  FAIL  ${label} — render threw: ${(error as Error).message}`)
  }
}

console.log('\nEmergency helper checks')
check('tel href for 112', buildTelHref('112') === 'tel:112')
check('tel href strips formatting', buildTelHref('+91 98765-43210') === 'tel:+919876543210')
check('default emergency number is 112', EMERGENCY_SERVICES_NUMBER === '112')
check('default ambulance number is 108', AMBULANCE_NUMBER === '108')
check('valid phone accepted', isValidPhone('9876543210') && isValidPhone('+91 98765 43210'))
check('invalid phone rejected', !isValidPhone('abc') && !isValidPhone('123'))
check(
  'dialNumber refuses without a browser window',
  dialNumber('112') === false
)
check(
  'maps url built from coordinates',
  buildMapsUrl(12.9716, 77.5946) === 'https://www.google.com/maps/search/?api=1&query=12.9716,77.5946'
)
check(
  'share text includes coordinates',
  buildShareText(12.9716, 77.5946).includes('12.97160, 77.59460')
)

// --- Part 2 helpers ---
const dirUrl = buildDirectionsUrl({ latitude: 12.97, longitude: 77.59, address: 'MG Road' })
check(
  'directions url uses coordinates as destination',
  dirUrl.includes('destination=12.97%2C77.59') && dirUrl.includes('travelmode=driving')
)
const dirAddr = buildDirectionsUrl({ latitude: null, longitude: null, address: '15 MG Road', city: 'Bengaluru' })
check('directions url falls back to address', dirAddr.includes('destination=15+MG+Road%2C+Bengaluru'))
const dirOrigin = buildDirectionsUrl(
  { latitude: 12.97, longitude: 77.59, address: 'x' },
  { latitude: 12.9, longitude: 77.6 }
)
check('directions url includes origin when known', dirOrigin.includes('origin=12.9%2C77.6'))

check(
  'haversine distance is sane',
  Math.abs(haversineKm(12.9716, 77.5946, 12.9716, 77.5946)) < 1e-6 &&
    haversineKm(12.9716, 77.5946, 13.0, 77.6) > 1
)

const withEmergency: PublicHospital = {
  id: 'h1',
  name: 'Test Hospital',
  address: '1 Test Street',
  facilities: ['Emergency Department', '24/7 Emergency'],
}
const withoutEmergency: PublicHospital = {
  id: 'h2',
  name: 'Clinic',
  address: '2 Test Street',
  facilities: ['Pharmacy'],
}
const noFacilities: PublicHospital = { id: 'h3', name: 'Other', address: '3 Test Street' }
const infoYes = emergencyInfo(withEmergency)
const infoNo = emergencyInfo(withoutEmergency)
const infoUnknown = emergencyInfo(noFacilities)
check(
  'emergency capability listed only from facilities',
  infoYes.emergencyDepartment === 'listed' &&
    infoYes.open24x7 === 'listed' &&
    infoNo.emergencyDepartment === 'unknown' &&
    infoNo.open24x7 === 'unknown' &&
    infoUnknown.emergencyDepartment === 'unknown'
)

const originalNavigator = globalThis.navigator
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
  configurable: true,
})
const iosSms = buildSmsHref(['9876543210'], 'help')
check('ios sms uses &body=', iosSms.startsWith('sms:9876543210&body='))
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'Mozilla/5.0 (Linux; Android 14)' },
  configurable: true,
})
const androidSms = buildSmsHref(['9876543210'], 'help')
check('android sms uses ?body=', androidSms.startsWith('sms:9876543210?body='))
Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true })

console.log('\nPart 3 helper checks')

// Profile validation (TASK 1)
const emptyErrors = validateEmergencyProfile(EMPTY_EMERGENCY_PROFILE)
check('empty profile requires full name', Boolean(emptyErrors.full_name))
const validProfile: EmergencyProfile = {
  full_name: 'Priya Sharma',
  blood_group: 'O+',
  allergies: 'Penicillin',
  medications: 'Metformin 500mg',
  conditions: 'Type 2 diabetes',
  emergency_contact_name: 'Ravi Sharma',
  emergency_contact_number: '9876543210',
  additional_info: 'Pacemaker fitted 2022',
}
check(
  'valid profile passes validation',
  Object.keys(validateEmergencyProfile(validProfile)).length === 0
)
check(
  'invalid blood group rejected',
  Boolean(validateEmergencyProfile({ ...validProfile, blood_group: 'Z-' }).blood_group)
)
check(
  'invalid phone rejected',
  Boolean(validateEmergencyProfile({ ...validProfile, emergency_contact_number: 'abc' }).emergency_contact_number)
)
check(
  'contact number without name rejected',
  Boolean(
    validateEmergencyProfile({ ...validProfile, emergency_contact_name: '' }).emergency_contact_name
  )
)
check(
  'over-long name rejected',
  Boolean(
    validateEmergencyProfile({ ...validProfile, full_name: 'x'.repeat(121) }).full_name
  )
)
check(
  'content detection ignores blank profiles',
  !hasEmergencyProfileContent(EMPTY_EMERGENCY_PROFILE) && hasEmergencyProfileContent(validProfile)
)

// Share payload building (TASK 2) — only ticked, non-empty fields leave the client.
const partialPayload = buildSharePayload(validProfile, ['bloodGroup', 'emergencyContact'])
check(
  'payload only contains selected fields',
  !('name' in partialPayload) &&
    !('allergies' in partialPayload) &&
    partialPayload.bloodGroup === 'O+' &&
    partialPayload.emergencyContactName === 'Ravi Sharma'
)
const emptyPayload = buildSharePayload(validProfile, [])
check('no selection builds no payload', Object.keys(emptyPayload).length === 0)
const token = createShareToken()
check('share token is 48 lowercase hex chars', SHARE_TOKEN_PATTERN.test(token))
check('share tokens are unique', token !== createShareToken())

console.log('\nEmergency component render checks')

render(
  'CallConfirmDialog',
  React.createElement(CallConfirmDialog, {
    open: true,
    label: 'Call 112 – Emergency Services',
    number: '112',
    onCancel: () => {},
  }),
  ['Call 112 – Emergency Services', '112', 'Confirm call to', 'never places calls on its own', 'Cancel']
)

render(
  'SosButton',
  React.createElement(SosButton, { contacts: [], variant: 'hero' }),
  ['Emergency SOS', 'SOS', 'Tap for help']
)

render(
  'EmergencyCallActions',
  React.createElement(EmergencyCallActions, { className: 'grid' }),
  ['Call 112 – Emergency Services', 'Call Ambulance']
)

render(
  'EmergencyContactCallButton (empty)',
  React.createElement(EmergencyContactCallButton, { contacts: [] }),
  ['Call Emergency Contact']
)

render(
  'NearbyEmergencyHospitals',
  React.createElement(NearbyEmergencyHospitals, { hospitals: [] }),
  ['Find nearest', 'No hospitals listed right now', 'Browse all hospitals', 'search a place', 'Search hospitals by name or city']
)

// Part 2: hospital card content when data exists.
const sampleHospitals: PublicHospital[] = [
  {
    id: 'h1',
    name: 'Alpha Clinic',
    address: '4 Outer Ring Road',
    city: 'Bengaluru',
    phone: '+918099999999',
    verification_status: 'verified',
    facilities: ['Pharmacy'],
  },
  {
    id: 'h2',
    name: 'City Emergency Hospital',
    address: '12 MG Road',
    city: 'Bengaluru',
    phone: '+918012345678',
    latitude: 12.97,
    longitude: 77.59,
    verification_status: 'verified',
    facilities: ['Emergency Department', '24/7 Emergency'],
  },
]
const hospitalsHtml = renderToString(
  React.createElement(NearbyEmergencyHospitals, { hospitals: sampleHospitals })
)
check('hospital card shows name', hospitalsHtml.includes('City Emergency Hospital'))
check('hospital card shows address', hospitalsHtml.includes('12 MG Road'))
check('hospital card shows phone', hospitalsHtml.includes('+918012345678'))
check(
  'emergency-declaring hospital is ranked first despite alphabetical order',
  hospitalsHtml.indexOf('City Emergency Hospital') < hospitalsHtml.indexOf('Alpha Clinic')
)
check(
  'emergency department badge only when facilities declare it',
  hospitalsHtml.includes('Emergency department listed') &&
    hospitalsHtml.split('Emergency department listed').length - 1 === 1
)
check(
  'unconfirmed emergency services are labelled honestly',
  hospitalsHtml.includes('not confirmed')
)
check(
  '24/7 badge only when listed',
  hospitalsHtml.includes('24/7 emergency listed')
)
check('call hospital button present', hospitalsHtml.includes('Call hospital'))
check('get directions button present', hospitalsHtml.includes('Get directions'))
check('directions opens google maps', hospitalsHtml.includes('google.com/maps/dir/'))
check('manual location search present', hospitalsHtml.includes('PIN code'))
check('distance sort control present', hospitalsHtml.includes('Distance'))
check('emergency-first sort control present', hospitalsHtml.includes('Emergency first'))

render(
  'EmergencyContactsSection',
  React.createElement(EmergencyContactsSection, {
    contacts: [],
    loaded: true,
    addContact: () => true,
    updateContact: () => true,
    removeContact: () => true,
  }),
  ['Add an emergency contact', 'No contacts yet', 'Name', 'Phone number', 'Your emergency contacts']
)

// Part 2: edit + share affordances with an existing contact.
const contactsHtml = renderToString(
  React.createElement(EmergencyContactsSection, {
    contacts: [{ id: 'c1', name: 'Priya Sharma', relation: 'Spouse', phone: '9876543210' }],
    loaded: true,
    addContact: () => true,
    updateContact: () => true,
    removeContact: () => true,
  })
)
check('contact shows name and phone', contactsHtml.includes('Priya Sharma') && contactsHtml.includes('9876543210'))
check('edit contact button present', contactsHtml.includes('Edit Priya Sharma'))
check('share location button present', contactsHtml.includes('Share location'))
check('remove contact button present', contactsHtml.includes('Remove Priya Sharma'))

render(
  'ShareLocationDialog',
  React.createElement(ShareLocationDialog, {
    open: true,
    contact: { id: 'c1', name: 'Priya Sharma', relation: 'Spouse', phone: '9876543210' },
    onCancel: () => {},
  }),
  ['Share location with', 'Priya Sharma', 'Get my current location', 'sent only when you choose', 'Cancel']
)

render(
  'LocationShare',
  React.createElement(LocationShare, { contacts: [] }),
  ['Share my location', 'Locate me', 'never sent anywhere']
)

const sampleProfile: EmergencyProfile = {
  full_name: 'Priya Sharma',
  blood_group: 'O+',
  allergies: 'Penicillin',
  medications: 'Metformin 500mg',
  conditions: 'Type 2 diabetes',
  emergency_contact_name: 'Ravi Sharma',
  emergency_contact_number: '9876543210',
  additional_info: 'Pacemaker fitted 2022',
}

render(
  'MedicalInfoSection (signed in)',
  React.createElement(MedicalInfoSection, {
    profile: sampleProfile,
    loaded: true,
    saving: false,
    exists: true,
    isAuthenticated: true,
    loadError: null,
    saveProfile: async () => ({ ok: true }),
    deleteProfile: async () => ({ ok: true }),
  }),
  [
    'My emergency medical information',
    'Full name',
    'Blood group',
    'Known allergies',
    'Current medications',
    'Existing medical conditions',
    'Emergency contact',
    'Additional important medical information',
    'Update information',
    'Delete saved information',
    'Privacy',
    'Row Level Security',
  ]
)

render(
  'MedicalInfoSection (signed out gate)',
  React.createElement(MedicalInfoSection, {
    profile: EMPTY_EMERGENCY_PROFILE,
    loaded: true,
    saving: false,
    exists: false,
    isAuthenticated: false,
    loadError: null,
    saveProfile: async () => ({ ok: true }),
    deleteProfile: async () => ({ ok: true }),
  }),
  ['Sign in to save your emergency medical information', '/auth/login?redirect=/emergency', 'never publicly']
)

render(
  'MedicalIdSection',
  React.createElement(MedicalIdSection, {
    profile: sampleProfile,
    profileLoaded: true,
    profileExists: true,
    isAuthenticated: true,
    shares: [
      {
        id: '11111111-2222-4333-8444-555555555555',
        token: 'a'.repeat(48),
        created_at: '2026-11-08T10:00:00.000Z',
        expires_at: '2026-11-09T10:00:00.000Z',
        payload: { name: 'Priya Sharma', bloodGroup: 'O+' },
      },
    ],
    loaded: true,
    creating: false,
    activeShareUrl: null,
    createShare: async () => ({ ok: true, url: 'https://example.test/emergency/medical-id/' + 'a'.repeat(48) }),
    revokeShare: async () => ({ ok: true }),
    clearActiveShare: () => {},
  }),
  [
    'Digital Emergency Medical ID',
    'Choose what your QR code shares',
    'Generate QR code',
    'Link valid for',
    'Active shares',
    'Revoke',
    'Patient name',
    'Blood group',
    'Known allergies',
    'Medical conditions',
    'Emergency contact',
    'fields shared',
  ]
)

render(
  'SharedMedicalIdCard',
  React.createElement(SharedMedicalIdCard, {
    payload: {
      name: 'Priya Sharma',
      bloodGroup: 'O+',
      allergies: 'Penicillin',
      emergencyContactName: 'Ravi Sharma',
      emergencyContactPhone: '9876543210',
    },
    expiresAt: '2026-11-09T10:00:00.000Z',
  }),
  [
    'Shared Emergency Medical ID',
    'Patient name',
    'Priya Sharma',
    'Blood group',
    'O+',
    'Known allergies',
    'Penicillin',
    'Emergency contact',
    'Ravi Sharma',
    'does not verify',
    'call 112',
  ]
)

const sharedHtml = renderToString(
  React.createElement(SharedMedicalIdCard, {
    payload: { name: 'Priya Sharma' },
  })
)
check(
  'shared card never renders unshared fields',
  !sharedHtml.includes('Penicillin') &&
    !sharedHtml.includes('Metformin') &&
    !sharedHtml.includes('9876543210')
)

render('FirstAidGuide', React.createElement(FirstAidGuide), [
  'Educational guide — not medical advice',
  'Suspected heart attack',
  'Heavy bleeding',
  'Burns and scalds',
  'Choking',
  'Fractures (suspected broken bone)',
  'Unconsciousness',
  'Important warnings',
  'Do NOT',
  'Call 112 now',
  'Sources used for this guide',
  'NHS — Heart attack',
])

render('EmergencyDashboard', React.createElement(EmergencyDashboard, { hospitals: sampleHospitals }), [
  'Emergency Assistance',
  'SOS',
  'Call 112 – Emergency Services',
  'Call Ambulance',
  'Call Emergency Contact',
  'Quick Access',
  'Nearby Emergency Hospitals',
  'My Emergency Contacts',
  'Medical Information',
  'Digital Medical ID',
  'First Aid Guide',
  'does not dispatch ambulances',
])

// Hooks keep the same shape the dashboard relies on (Part 3 adds the
// Supabase-backed profile + medical-ID hooks, which work without an
// AuthProvider by treating the visitor as signed out).
function HookProbe() {
  const contactsApi = useEmergencyContacts()
  const medicalApi = useEmergencyMedicalInfo()
  const profileApi = useEmergencyProfile()
  const ok =
    Array.isArray(contactsApi.contacts) &&
    typeof contactsApi.addContact === 'function' &&
    typeof contactsApi.updateContact === 'function' &&
    typeof contactsApi.removeContact === 'function' &&
    typeof medicalApi.saveInfo === 'function' &&
    typeof medicalApi.clearInfo === 'function' &&
    'bloodGroup' in medicalApi.info &&
    typeof profileApi.saveProfile === 'function' &&
    typeof profileApi.deleteProfile === 'function' &&
    'full_name' in profileApi.profile &&
    profileApi.isAuthenticated === false
  return React.createElement('span', null, ok ? 'hooks-ok' : 'hooks-bad')
}
render('Emergency storage hooks', React.createElement(HookProbe), ['hooks-ok'])

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
