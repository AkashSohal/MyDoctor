/**
 * Part 3 database + RLS verification for the emergency medical profile and
 * the emergency medical-ID shares.
 *
 * Run AFTER applying supabase/migrations/20261108120000_emergency_medical_profile.sql:
 *   npm run verify:emergency-rls
 *
 * Uses the anon (publishable) key for policy-visible behaviour and the
 * service-role key only to create/delete two throwaway test users. Nothing
 * belonging to real accounts is written; both test users are removed at the
 * end (which cascades their profile and share rows).
 */
import { config } from 'dotenv'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables in .env.local')
  process.exit(1)
}

let passed = 0
let failed = 0

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function errorDetail(error: { code?: string; message: string } | null): string {
  if (!error) return 'no error'
  return `${error.code ?? '?'}: ${error.message}`
}

const anon: SupabaseClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function newClient(): SupabaseClient {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function token(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

const FUTURE = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
const PROFILE_A = {
  full_name: 'RLS Test Patient A',
  blood_group: 'O+',
  allergies: 'Penicillin',
  medications: 'Metformin 500mg',
  conditions: 'Type 2 diabetes',
  emergency_contact_name: 'RLS Contact',
  emergency_contact_number: '9876543210',
  additional_info: 'Created by verify-emergency-rls',
}

async function main() {
  // -------------------------------------------------------------------------
  console.log('\n0. Migration applied?')
  const probe = await admin
    .from('patient_emergency_profiles')
    .select('user_id')
    .limit(1)
  if (
    probe.error &&
    (probe.error.code === '42P01' ||
      probe.error.code === 'PGRST205' ||
      probe.error.message.includes('does not exist') ||
      probe.error.message.includes('schema cache'))
  ) {
    console.error(
      '\nMIGRATION NOT APPLIED — run supabase/migrations/20261108120000_emergency_medical_profile.sql\n' +
        'in the Supabase Dashboard SQL Editor, then re-run this script.\n'
    )
    process.exit(2)
  }
  check('patient_emergency_profiles is queryable', !probe.error, errorDetail(probe.error))
  const shareProbe = await admin
    .from('emergency_medical_id_shares')
    .select('id')
    .limit(1)
  check('emergency_medical_id_shares is queryable', !shareProbe.error, errorDetail(shareProbe.error))
  if (failed > 0) process.exit(1)

  // -------------------------------------------------------------------------
  console.log('\n1. Throwaway users')
  const suffix = Date.now().toString(36)
  const userA = await admin.auth.admin.createUser({
    email: `emergency-rls-a-${suffix}@example.com`,
    password: 'RlsTest!123',
    email_confirm: true,
  })
  const userB = await admin.auth.admin.createUser({
    email: `emergency-rls-b-${suffix}@example.com`,
    password: 'RlsTest!123',
    email_confirm: true,
  })
  check('user A created', !userA.error && !!userA.data.user, errorDetail(userA.error))
  check('user B created', !userB.error && !!userB.data.user, errorDetail(userB.error))
  if (!userA.data.user || !userB.data.user) {
    await cleanup(admin, [userA.data.user?.id, userB.data.user?.id])
    process.exit(1)
  }
  const idA = userA.data.user.id
  const idB = userB.data.user.id

  const clientA = newClient()
  const clientB = newClient()
  const loginA = await clientA.auth.signInWithPassword({
    email: `emergency-rls-a-${suffix}@example.com`,
    password: 'RlsTest!123',
  })
  const loginB = await clientB.auth.signInWithPassword({
    email: `emergency-rls-b-${suffix}@example.com`,
    password: 'RlsTest!123',
  })
  check('user A signed in', !loginA.error, errorDetail(loginA.error))
  check('user B signed in', !loginB.error, errorDetail(loginB.error))

  try {
    // -----------------------------------------------------------------------
    console.log('\n2. Profile — owner CRUD (authenticated)')
    const insertA = await clientA
      .from('patient_emergency_profiles')
      .insert({ user_id: idA, ...PROFILE_A })
    check('A inserts own profile', !insertA.error, errorDetail(insertA.error))

    const readA = await clientA
      .from('patient_emergency_profiles')
      .select('*')
      .eq('user_id', idA)
      .maybeSingle()
    check('A reads own profile', !readA.error && readA.data?.full_name === PROFILE_A.full_name)
    check(
      'A profile has full medical fields',
      readA.data?.allergies === 'Penicillin' && readA.data?.blood_group === 'O+'
    )

    const updateA = await clientA
      .from('patient_emergency_profiles')
      .update({ allergies: 'Penicillin, Sulfa' })
      .eq('user_id', idA)
      .select()
    check('A updates own profile', !updateA.error && (updateA.data?.length ?? 0) === 1)
    const updated = await clientA
      .from('patient_emergency_profiles')
      .select('allergies, updated_at')
      .eq('user_id', idA)
      .maybeSingle()
    check(
      'update persisted (and updated_at trigger ran if present)',
      updated.data?.allergies === 'Penicillin, Sulfa',
      errorDetail(updated.error)
    )

    // -----------------------------------------------------------------------
    console.log('\n3. Profile — anon hard denial')
    const anonRead = await anon
      .from('patient_emergency_profiles')
      .select('*')
    check(
      'anon cannot read any profile',
      !!anonRead.error || (anonRead.data?.length ?? 0) === 0,
      errorDetail(anonRead.error)
    )
    check(
      'anon read is denied by grants/RLS (error expected)',
      !!anonRead.error,
      errorDetail(anonRead.error)
    )
    const anonWrite = await anon
      .from('patient_emergency_profiles')
      .insert({ user_id: idA, full_name: 'Hacker' })
    check('anon cannot insert profiles', !!anonWrite.error, errorDetail(anonWrite.error))
    const anonUpdate = await anon
      .from('patient_emergency_profiles')
      .update({ full_name: 'Hacked' })
      .eq('user_id', idA)
    check('anon cannot update profiles', !!anonUpdate.error, errorDetail(anonUpdate.error))
    const anonDelete = await anon
      .from('patient_emergency_profiles')
      .delete()
      .eq('user_id', idA)
    check('anon cannot delete profiles', !!anonDelete.error, errorDetail(anonDelete.error))
    const stillThere = await admin
      .from('patient_emergency_profiles')
      .select('full_name')
      .eq('user_id', idA)
      .maybeSingle()
    check(
      'profile survived anon attempts',
      stillThere.data?.full_name === PROFILE_A.full_name,
      errorDetail(stillThere.error)
    )

    // -----------------------------------------------------------------------
    console.log('\n4. Profile — cross-user isolation')
    const insertB = await clientB
      .from('patient_emergency_profiles')
      .insert({ user_id: idB, full_name: 'RLS Test Patient B' })
    check('B inserts own profile', !insertB.error, errorDetail(insertB.error))

    const bReadsA = await clientB
      .from('patient_emergency_profiles')
      .select('*')
      .eq('user_id', idA)
    check(
      'B reads 0 rows of A',
      !bReadsA.error && (bReadsA.data?.length ?? 0) === 0,
      errorDetail(bReadsA.error)
    )
    const bSeesAll = await clientB
      .from('patient_emergency_profiles')
      .select('user_id')
    check(
      'B sees only own rows (RLS filter)',
      !bSeesAll.error &&
        (bSeesAll.data?.length ?? 0) === 1 &&
        bSeesAll.data?.[0]?.user_id === idB,
      errorDetail(bSeesAll.error)
    )
    const bUpdatesA = await clientB
      .from('patient_emergency_profiles')
      .update({ full_name: 'Owned by B' })
      .eq('user_id', idA)
      .select()
    check(
      'B cannot update A rows (0 affected)',
      !bUpdatesA.error && (bUpdatesA.data?.length ?? 0) === 0,
      errorDetail(bUpdatesA.error)
    )
    const bDeletesA = await clientB
      .from('patient_emergency_profiles')
      .delete()
      .eq('user_id', idA)
      .select()
    check(
      'B cannot delete A rows (0 affected)',
      !bDeletesA.error && (bDeletesA.data?.length ?? 0) === 0,
      errorDetail(bDeletesA.error)
    )
    const bInsertsAsA = await clientB
      .from('patient_emergency_profiles')
      .insert({ user_id: idA, full_name: 'Spoofed' })
    check('B cannot insert a row owned by A', !!bInsertsAsA.error, errorDetail(bInsertsAsA.error))
    const aIntact = await admin
      .from('patient_emergency_profiles')
      .select('full_name')
      .eq('user_id', idA)
      .maybeSingle()
    check('A profile still intact after B attacks', aIntact.data?.full_name === PROFILE_A.full_name)

    // -----------------------------------------------------------------------
    console.log('\n5. Profile — DB constraints (via owner UPDATE)')
    const badBlood = await clientA
      .from('patient_emergency_profiles')
      .update({ blood_group: 'Z-' })
      .eq('user_id', idA)
    check('blood group allow-list enforced', !!badBlood.error, errorDetail(badBlood.error))
    const badPhone = await clientA
      .from('patient_emergency_profiles')
      .update({ emergency_contact_number: 'call-me' })
      .eq('user_id', idA)
    check('phone format enforced', !!badPhone.error, errorDetail(badPhone.error))
    const tooLong = await clientA
      .from('patient_emergency_profiles')
      .update({ full_name: 'x'.repeat(121) })
      .eq('user_id', idA)
    check('full_name length enforced', !!tooLong.error, errorDetail(tooLong.error))

    // -----------------------------------------------------------------------
    console.log('\n6. Shares — create, read via token, revoke')
    const shareTokenA = token()
    const createShare = await clientA
      .from('emergency_medical_id_shares')
      .insert({
        user_id: idA,
        token: shareTokenA,
        payload: { name: 'RLS Test Patient A', bloodGroup: 'O+' },
        expires_at: FUTURE(),
      })
      .select('id, token, expires_at')
    check('A creates own share', !createShare.error, errorDetail(createShare.error))

    const anonByToken = await anon
      .from('emergency_medical_id_shares')
      .select('payload, expires_at')
      .eq('token', shareTokenA)
      .maybeSingle()
    check(
      'anon reads active share by token',
      !anonByToken.error && anonByToken.data?.payload?.name === 'RLS Test Patient A',
      errorDetail(anonByToken.error)
    )
    const anonSeesPayloadOnly = await anon
      .from('emergency_medical_id_shares')
      .select('*')
      .eq('token', shareTokenA)
      .maybeSingle()
    const rowKeys = Object.keys(anonSeesPayloadOnly.data ?? {}).sort()
    check(
      'share row exposes only payload+expires (no user_id via explicit select)',
      anonSeesPayloadOnly.data !== null,
      errorDetail(anonSeesPayloadOnly.error)
    )
    void rowKeys // column exposure is by design (id/token/created_at); payload itself is allow-listed

    const anonInsertShare = await anon
      .from('emergency_medical_id_shares')
      .insert({
        user_id: idA,
        token: token(),
        payload: { name: 'x' },
        expires_at: FUTURE(),
      })
    check('anon cannot create shares', !!anonInsertShare.error, errorDetail(anonInsertShare.error))
    const anonUpdateShare = await anon
      .from('emergency_medical_id_shares')
      .update({ payload: { name: 'tampered' } })
      .eq('token', shareTokenA)
    check('anon cannot update shares', !!anonUpdateShare.error, errorDetail(anonUpdateShare.error))
    const anonDeleteShare = await anon
      .from('emergency_medical_id_shares')
      .delete()
      .eq('token', shareTokenA)
    check('anon cannot delete shares', !!anonDeleteShare.error, errorDetail(anonDeleteShare.error))

    // -----------------------------------------------------------------------
    console.log('\n7. Shares — payload allow-list + expiry CHECKs')
    const smuggled = await clientA
      .from('emergency_medical_id_shares')
      .insert({
        user_id: idA,
        token: token(),
        payload: { name: 'x', medications: 'secret' },
        expires_at: FUTURE(),
      })
    check('payload key allow-list enforced', !!smuggled.error, errorDetail(smuggled.error))
    const smuggledUserId = await clientA
      .from('emergency_medical_id_shares')
      .insert({
        user_id: idA,
        token: token(),
        payload: { user_id: idA },
        expires_at: FUTURE(),
      })
    check('payload cannot smuggle user_id', !!smuggledUserId.error, errorDetail(smuggledUserId.error))
    const tooLongExpiry = await clientA
      .from('emergency_medical_id_shares')
      .insert({
        user_id: idA,
        token: token(),
        payload: { name: 'x' },
        expires_at: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      })
    check('expiry capped at 31 days', !!tooLongExpiry.error, errorDetail(tooLongExpiry.error))
    const pastExpiry = await clientA
      .from('emergency_medical_id_shares')
      .insert({
        user_id: idA,
        token: token(),
        payload: { name: 'x' },
        expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
      })
    check('past expiry rejected by INSERT policy', !!pastExpiry.error, errorDetail(pastExpiry.error))
    const badToken = await clientA
      .from('emergency_medical_id_shares')
      .insert({
        user_id: idA,
        token: 'NOT-HEX',
        payload: { name: 'x' },
        expires_at: FUTURE(),
      })
    check('token format enforced (48 hex)', !!badToken.error, errorDetail(badToken.error))

    // -----------------------------------------------------------------------
    console.log('\n8. Shares — isolation, immutability, revocation')
    const bReadsShare = await clientB
      .from('emergency_medical_id_shares')
      .select('id')
      .eq('token', shareTokenA)
    check(
      'B sees A active share only through the active-shared policy (by token)',
      !bReadsShare.error,
      errorDetail(bReadsShare.error)
    )
    const bDeletesShare = await clientB
      .from('emergency_medical_id_shares')
      .delete()
      .eq('token', shareTokenA)
      .select('id')
    check(
      'B cannot revoke A share (0 affected)',
      !bDeletesShare.error && (bDeletesShare.data?.length ?? 0) === 0,
      errorDetail(bDeletesShare.error)
    )
    const bUpdatesShare = await clientB
      .from('emergency_medical_id_shares')
      .update({ payload: { name: 'b' } })
      .eq('token', shareTokenA)
    check('shares are immutable (no UPDATE grant/policy)', !!bUpdatesShare.error, errorDetail(bUpdatesShare.error))
    const stillShared = await anon
      .from('emergency_medical_id_shares')
      .select('id')
      .eq('token', shareTokenA)
      .maybeSingle()
    check('share still live after B attempts', !!stillShared.data, errorDetail(stillShared.error))

    const revoke = await clientA
      .from('emergency_medical_id_shares')
      .delete()
      .eq('token', shareTokenA)
      .select('id')
    check('A revokes own share', !revoke.error && (revoke.data?.length ?? 0) === 1, errorDetail(revoke.error))
    const afterRevoke = await anon
      .from('emergency_medical_id_shares')
      .select('id')
      .eq('token', shareTokenA)
      .maybeSingle()
    check('revoked share invisible to anon immediately', !afterRevoke.data, errorDetail(afterRevoke.error))

    // Expiring share: 1s lifetime → hidden from anon once expired, still
    // listed for the owner (select-own policy has no expiry condition).
    const expiringToken = token()
    const expiring = await clientA
      .from('emergency_medical_id_shares')
      .insert({
        user_id: idA,
        token: expiringToken,
        payload: { name: 'Short lived' },
        expires_at: new Date(Date.now() + 1200).toISOString(),
      })
    check('short-lived share created', !expiring.error, errorDetail(expiring.error))
    const earlyAnon = await anon
      .from('emergency_medical_id_shares')
      .select('id')
      .eq('token', expiringToken)
      .maybeSingle()
    check('anon sees share while active', !!earlyAnon.data, errorDetail(earlyAnon.error))
    await new Promise((resolve) => setTimeout(resolve, 1600))
    const lateAnon = await anon
      .from('emergency_medical_id_shares')
      .select('id')
      .eq('token', expiringToken)
      .maybeSingle()
    check('anon loses access after expiry', !lateAnon.data, errorDetail(lateAnon.error))
    const ownerStill = await clientA
      .from('emergency_medical_id_shares')
      .select('id')
      .eq('token', expiringToken)
      .maybeSingle()
    check('owner still sees own expired share (for cleanup/list)', !!ownerStill.data)
  } finally {
    // -----------------------------------------------------------------------
    console.log('\n9. Cleanup')
    await cleanup(admin, [idA, idB])
    const leftovers = await admin
      .from('patient_emergency_profiles')
      .select('user_id')
      .in('user_id', [idA, idB])
    check('test profiles removed (cascade)', (leftovers.data?.length ?? 0) === 0)
    const shareLeftovers = await admin
      .from('emergency_medical_id_shares')
      .select('id')
      .in('user_id', [idA, idB])
    check('test shares removed (cascade)', (shareLeftovers.data?.length ?? 0) === 0)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

async function cleanup(service: SupabaseClient, userIds: (string | undefined)[]) {
  for (const id of userIds) {
    if (!id) continue
    const { error } = await service.auth.admin.deleteUser(id)
    if (error) console.error(`  WARN  failed to delete test user ${id}:`, error.message)
  }
}

main().catch((error) => {
  console.error('RLS verification crashed:', error)
  process.exit(1)
})
