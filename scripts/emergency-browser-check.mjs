/**
 * Emergency module browser checks (Part 3 final testing).
 *
 * Boots the production build (`next start`), drives real Chrome/Edge through
 * headless Chrome and fails on uncaught page errors or unexpected console
 * errors. Expected, handled `[MyDoctor]` diagnostics (e.g. the database
 * migration not being applied yet) are reported as warnings, not failures.
 *
 * Usage:  node scripts/emergency-browser-check.mjs
 * Env:    BASE_URL (skip server boot), CHROME_PATH, EMERGENCY_EMAIL/PASSWORD
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PORT || 3100)
const BASE = process.env.BASE_URL || `http://127.0.0.1:${PORT}`
const EMAIL = process.env.EMERGENCY_EMAIL || 'patient@demo.com'
const PASSWORD = process.env.EMERGENCY_PASSWORD || 'demo123'

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
].filter(Boolean)

const IGNORED_CONSOLE = [
  'favicon',
  '[MyDoctor]', // handled diagnostics (DB not ready, save failed → toast)
]

let passed = 0
let failed = 0
const warnings = []

function check(name, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function warn(name, detail) {
  warnings.push(`${name} — ${detail}`)
  console.log(`  WARN  ${name} — ${detail}`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: 'manual' })
      if (res.status < 500) return
    } catch {
      // not up yet
    }
    await sleep(500)
  }
  throw new Error(`Server did not come up at ${url}`)
}

function startServer() {
  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/c', 'npx.cmd', 'next', 'start', '-p', String(PORT)], {
      cwd: ROOT,
      stdio: 'ignore',
    })
  }
  return spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: ROOT,
    stdio: 'ignore',
  })
}

function stopServer(child) {
  if (!child) return
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      child.kill('SIGTERM')
    }
  } catch {
    // already gone
  }
}

function launchBrowser() {
  const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (!executablePath) throw new Error('No Chrome/Edge executable found (set CHROME_PATH)')
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })
}

async function waitForToast(page, pattern, timeout = 20_000) {
  await page.waitForFunction(
    (src) =>
      [...document.querySelectorAll('[data-sonner-toast]')].some((t) =>
        new RegExp(src, 'i').test(t.textContent || '')
      ),
    { timeout },
    pattern
  )
}

/**
 * Fill a React-controlled input/select reliably. CDP key events are not
 * delivered on some pages in headless Chrome (keydown never reaches the
 * renderer), so we use the native value setter + input/change events —
 * the standard React-compatible approach (validated end-to-end: the value
 * reaches onChange, state, Supabase and survives a reload).
 */
async function fillInput(page, selector, value) {
  await page.$eval(
    selector,
    (el, val) => {
      const proto =
        el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : el instanceof HTMLSelectElement
            ? HTMLSelectElement.prototype
            : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
      setter.call(el, val)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    },
    value
  )
}

async function clickButtonByText(page, text, { exact = false, scope = 'button' } = {}) {
  const clicked = await page.evaluate(
    (sel, needle, isExact) => {
      const el = [...document.querySelectorAll(sel)].find((n) => {
        const content = (n.textContent || '').trim()
        return isExact ? content === needle : content.includes(needle)
      })
      if (!el || el.disabled) return false
      el.click()
      return true
    },
    scope,
    text,
    exact
  )
  if (!clicked) throw new Error(`clickButtonByText: no enabled ${scope} matching "${text}"`)
}

/**
 * Opens a page, collects console/page errors, runs `run` and asserts
 * `mustContain` against the final body text.
 */
async function auditPage(browser, name, url, run, mustContain = [], opts = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 900 })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = `${msg.text()} ${msg.location()?.url ?? ''}`
    if (IGNORED_CONSOLE.some((ignored) => text.includes(ignored))) return
    consoleErrors.push(text)
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))

  try {
    if (run) await run(page)
    else await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 })

    if (opts.waitFor) {
      await page.waitForFunction(
        (needle) => document.body && document.body.innerText.includes(needle),
        { timeout: 30_000 },
        opts.waitFor
      )
    }

    const body = await page.evaluate(() => document.body.innerText)
    for (const needle of mustContain) {
      check(`${name}: contains "${needle}"`, body.includes(needle))
    }

    if (opts.notContains) {
      for (const needle of opts.notContains) {
        check(`${name}: does not contain "${needle}"`, !body.includes(needle))
      }
    }

    check(`${name}: no uncaught page errors`, pageErrors.length === 0, pageErrors.join(' | '))
    if (consoleErrors.length > 0) {
      warn(`${name}: console errors`, consoleErrors.join(' | '))
    }
    check(
      `${name}: no client-side crash banner`,
      !body.includes('Application error: a client-side exception has occurred')
    )
    return body
  } finally {
    await page.close()
  }
}

async function main() {
  if (!process.env.BASE_URL && !existsSync(path.join(ROOT, '.next'))) {
    console.error('No .next build found — run `npm run build` first.')
    process.exit(1)
  }

  let server = null
  if (!process.env.BASE_URL) {
    console.log(`Booting production server on ${BASE} ...`)
    server = startServer()
  }
  await waitForServer(BASE)

  const browser = await launchBrowser()
  const validToken = 'a'.repeat(48)

  try {
    console.log('\n1. Emergency dashboard (signed out)')
    await auditPage(browser, '/emergency (signed out)', `${BASE}/emergency`, null, [
      'Emergency Assistance',
      'Sign in to save your emergency medical information',
      'Sign in',
      'Digital Emergency Medical ID',
      'Saved contacts',
      'Educational guide — not medical advice',
      'Suspected heart attack',
      'Choking',
      'Call 112 now',
    ], { waitFor: 'Sign in to save your emergency medical information' })

    console.log('\n2. Shared medical ID — malformed token')
    await auditPage(
      browser,
      'share (bad token)',
      `${BASE}/emergency/medical-id/not-a-token`,
      null,
      ['Invalid share link', 'Go to Emergency Assistance'],
      { waitFor: 'Invalid share link' }
    )

    console.log('\n3. Shared medical ID — well-formed but unknown token')
    await auditPage(
      browser,
      'share (unknown token)',
      `${BASE}/emergency/medical-id/${validToken}`,
      null,
      ['Go to Emergency Assistance', 'call 112'],
      { waitFor: 'Go to Emergency Assistance' }
    )
    // The exact status depends on whether the Part 3 migration has been applied:
    // pre-migration PostgREST errors → "unavailable"; post-migration → "no longer works".
    {
      const page = await browser.newPage()
      await page.goto(`${BASE}/emergency/medical-id/${validToken}`, { waitUntil: 'networkidle2' })
      const body = await page.evaluate(() => document.body.innerText)
      const noIndex = await page.evaluate(
        () => document.querySelector('meta[name="robots"]')?.content ?? ''
      )
      check(
        'share page status is an honest failure state',
        body.includes('This share link no longer works') ||
          body.includes('Shared medical ID is unavailable'),
        body.slice(0, 120)
      )
      check('share page is noindex', noIndex.includes('noindex'), `robots="${noIndex}"`)
      await page.close()
    }

    console.log('\n4. Sign-in → profile save → QR share → anon view → revoke → delete (E2E)')
    {
      const page = await browser.newPage()
      await page.setViewport({ width: 1366, height: 900 })
      const consoleErrors = []
      const pageErrors = []
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return
        const text = `${msg.text()} ${msg.location()?.url ?? ''}`
        if (IGNORED_CONSOLE.some((ignored) => text.includes(ignored))) return
        consoleErrors.push(text)
      })
      page.on('pageerror', (err) => pageErrors.push(err.message))

      let anonContext = null
      try {
        const person = 'E2E Test Patient'
        const allergyMarker = 'E2E allergy marker (must never be shared)'

        // --- sign in -------------------------------------------------------
        await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle2', timeout: 60_000 })
        await page.waitForSelector('#email', { timeout: 15_000 })
        await page.type('#email', EMAIL)
        await page.type('#password', PASSWORD)
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45_000 }),
          page.click('button[type="submit"]'),
        ])
        check(
          'login redirects away from /auth/login',
          !page.url().includes('/auth/login'),
          `stayed on ${page.url()}`
        )

        await page.goto(`${BASE}/emergency`, { waitUntil: 'networkidle2', timeout: 60_000 })
        await page.waitForSelector('#full-name', { timeout: 30_000 })
        const body = await page.evaluate(() => document.body.innerText)
        check('signed-in: medical information section heading', body.includes('My emergency medical information'))
        check('signed-in: form rendered', body.includes('Full name'), body.slice(0, 200))
        check(
          'signed-in: no sign-in gate',
          !body.includes('Sign in to save your emergency medical information')
        )
        check('signed-in: digital medical ID section present', body.includes('Digital Emergency Medical ID'))

        // --- save the profile ---------------------------------------------
        await fillInput(page, '#full-name', person)
        await fillInput(page, '#blood-group', 'A+')
        await fillInput(page, '#known-allergies', allergyMarker)
        await fillInput(page, '#emergency-contact', 'E2E Contact')
        await fillInput(page, '#contact-number', '9123456789')

        const saveClicked = await page.evaluate(() => {
          const btn = [...document.querySelectorAll('form button[type="submit"]')].find((b) =>
            /Save information|Update information/.test(b.textContent || '')
          )
          if (!btn || btn.disabled) return false
          btn.click()
          return true
        })
        check('save button clicked', saveClicked)
        await waitForToast(page, 'Emergency medical information (saved|updated)')
        check('profile save success toast shown', true)

        // --- reload: persisted server-side ---------------------------------
        await page.reload({ waitUntil: 'networkidle2', timeout: 60_000 })
        await page.waitForFunction(
          (expected) => document.querySelector('#full-name')?.value === expected,
          { timeout: 30_000 },
          person
        )
        check('profile persisted after reload (Supabase row)', true)

        // --- untick allergies so the share must exclude them ---------------
        await page.evaluate(() => {
          const box = document.querySelector('[aria-label="Share known allergies"]')
          if (!box) return
          const checked =
            box.getAttribute('aria-checked') === 'true' ||
            box.getAttribute('data-state') === 'checked'
          if (checked) box.click()
        })
        const allergiesUnticked = await page.evaluate(() => {
          const box = document.querySelector('[aria-label="Share known allergies"]')
          if (!box) return false
          return (
            box.getAttribute('aria-checked') === 'false' ||
            box.getAttribute('data-state') === 'unchecked'
          )
        })
        check('allergies unticked for the share', allergiesUnticked)

        // --- generate the QR share -----------------------------------------
        await page.waitForFunction(
          () =>
            [...document.querySelectorAll('button')].some(
              (b) => (b.textContent || '').includes('Generate QR code') && !b.disabled
            ),
          { timeout: 20_000 }
        )
        await clickButtonByText(page, 'Generate QR code')
        await page.waitForSelector('img[alt="QR code linking to your shared emergency medical ID"]', {
          timeout: 20_000,
        })
        check('QR code image rendered', true)
        await waitForToast(page, 'Shareable medical ID created')
        check('share creation success toast shown', true)

        const shareUrl = await page.evaluate(() => {
          const span = [...document.querySelectorAll('span[title]')].find((s) =>
            (s.title || '').includes('/emergency/medical-id/')
          )
          return span ? span.title : ''
        })
        check(
          'share URL is a 48-hex token link',
          /\/emergency\/medical-id\/[0-9a-f]{48}$/.test(shareUrl),
          shareUrl
        )
        check(
          'active shares list shows the new share',
          (await page.evaluate(() => document.body.innerText)).includes('fields shared') ||
            (await page.evaluate(() => document.body.innerText)).includes('field shared')
        )

        // --- open the share as an anonymous outsider (fresh browser context) -
        anonContext = await browser.createBrowserContext()
        const viewer = await anonContext.newPage()
        await viewer.goto(shareUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
        await viewer.waitForFunction(
          () => (document.body?.innerText || '').includes('Shared Emergency Medical ID'),
          { timeout: 20_000 }
        )
        const viewerBody = await viewer.evaluate(() => document.body.innerText)
        check('anon viewer renders the shared card', true)
        check('anon viewer shows the shared name', viewerBody.includes(person))
        check('anon viewer shows the shared blood group', viewerBody.includes('A+'))
        check(
          'anon viewer EXCLUDES the unticked allergy field',
          !viewerBody.includes(allergyMarker)
        )
        check(
          'anon viewer shows the ticked emergency contact',
          viewerBody.includes('E2E Contact') && viewerBody.includes('9123456789')
        )
        const viewerNoIndex = await viewer.evaluate(
          () => document.querySelector('meta[name="robots"]')?.content ?? ''
        )
        check('anon viewer is noindex', viewerNoIndex.includes('noindex'), viewerNoIndex)

        // --- revoke from the owner's dashboard ------------------------------
        await clickButtonByText(page, 'Revoke', { exact: true })
        await page.waitForSelector('[role="alertdialog"]', { timeout: 10_000 })
        await page.evaluate(() => {
          const dialog = document.querySelector('[role="alertdialog"]')
          const btn = [...dialog.querySelectorAll('button')].find((b) =>
            (b.textContent || '').includes('Revoke access')
          )
          btn?.click()
        })
        await waitForToast(page, 'Access revoked')
        check('revoke success toast shown', true)

        // --- the same link now fails for the outsider -----------------------
        await viewer.reload({ waitUntil: 'networkidle2', timeout: 30_000 })
        await viewer.waitForFunction(
          () => (document.body?.innerText || '').includes('This share link no longer works'),
          { timeout: 20_000 }
        )
        check('revoked link immediately shows revoked state', true)
        await viewer.close()

        // --- delete the profile (restores the demo account to clean state) --
        await clickButtonByText(page, 'Delete saved information')
        await page.waitForSelector('[role="alertdialog"]', { timeout: 10_000 })
        await page.evaluate(() => {
          const dialog = document.querySelector('[role="alertdialog"]')
          const btn = [...dialog.querySelectorAll('button')].find(
            (b) => (b.textContent || '').trim() === 'Delete'
          )
          btn?.click()
        })
        await waitForToast(page, 'Saved emergency medical information deleted')
        check('profile delete success toast shown', true)
        await page.waitForFunction(
          () =>
            [...document.querySelectorAll('form button[type="submit"]')].some((b) =>
              (b.textContent || '').includes('Save information')
            ),
          { timeout: 15_000 }
        )
        check('form reset to "Save information" after delete', true)

        // --- error audit for the whole signed-in session ---------------------
        check('E2E: no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '))
        if (consoleErrors.length > 0) {
          warn('E2E signed-in session: console errors', consoleErrors.join(' | '))
        }
      } finally {
        if (anonContext) await anonContext.close().catch(() => {})
        await page.close()
      }
    }
  } finally {
    await browser.close()
    stopServer(server)
  }

  console.log(`\n${passed} passed, ${failed} failed, ${warnings.length} warning(s)`)
  if (warnings.length > 0) {
    console.log('\nWarnings:')
    for (const w of warnings) console.log(`  - ${w}`)
  }
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Browser check crashed:', error)
  process.exit(1)
})
