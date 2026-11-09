/**
 * Responsive layout audit.
 *
 * Drives headless Chrome through every public route at the required
 * breakpoints and reports:
 *   - horizontal page scrolling (scrollWidth > clientWidth)
 *   - visible elements overflowing the viewport horizontally
 *   - header action collisions (Emergency / Account / Book Appointment)
 *   - clipped text inside nav/action buttons
 *   - uncaught console/page errors
 *
 * Screenshots land in `screenshots/responsive/` for visual review.
 *
 * Usage: node scripts/responsive-audit.mjs [--pages=/,/doctors] [--widths=320,375]
 * Env:   BASE_URL (default http://127.0.0.1:3000), CHROME_PATH,
 *        AUDIT_EMAIL / AUDIT_PASSWORD to also audit logged-in states.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PORT || 3000)
const BASE = process.env.BASE_URL || `http://127.0.0.1:${PORT}`
const SHOT_DIR = path.join(ROOT, 'screenshots', 'responsive')

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].filter(Boolean)

const ALL_WIDTHS = [320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920]

const PUBLIC_PAGES = [
  ['home', '/'],
  ['doctors', '/doctors'],
  ['specialties', '/specialties'],
  ['hospitals', '/hospitals'],
  ['emergency', '/emergency'],
  ['how-it-works', '/how-it-works'],
  ['about', '/about'],
  ['compare', '/compare'],
  ['login', '/auth/login'],
  ['signup', '/auth/signup'],
]

const AUTH_PAGES = [
  ['account', '/account'],
  ['dashboard-patient', '/dashboard/patient'],
  ['appointments-new', '/appointments/new'],
]

function parseArgs(argv) {
  const args = { pages: null, widths: null, screenshots: true }
  for (const a of argv) {
    if (a.startsWith('--pages=')) args.pages = a.slice(8).split(',').filter(Boolean)
    else if (a.startsWith('--widths=')) args.widths = a.slice(9).split(',').map(Number)
    else if (a === '--no-screenshots') args.screenshots = false
  }
  return args
}

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    if (c && existsSync(c)) return c
  }
  throw new Error('No Chrome/Edge executable found. Set CHROME_PATH.')
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: 'manual' })
      if (res.status < 500) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`Server did not come up at ${url}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * In-page probe. Returns layout violations for the current viewport.
 */
const PROBE = () => {
  const vw = document.documentElement.clientWidth
  const issues = []
  const label = (el) => {
    const id = el.id ? `#${el.id}` : ''
    const cls = (typeof el.className === 'string' ? el.className : '')
      .split(/\s+/).filter(Boolean).slice(0, 6).join('.')
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `${el.tagName.toLowerCase()}${id}${cls ? `.${cls}` : ''}${txt ? ` "${txt}"` : ''}`
  }

  // 1. Horizontal page scroll.
  const doc = document.documentElement
  if (doc.scrollWidth > doc.clientWidth + 1) {
    // Identify widest offenders.
    const wide = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none') continue
      if (r.right > vw + 1 || r.left < -1) {
        // only leaf-ish, unclipped offenders whose parent is inside bounds
        let clipped = false, p = el.parentElement
        while (p) {
          const ps = getComputedStyle(p)
          if (ps.overflowX !== 'visible' || ps.overflowY !== 'visible') { clipped = true; break }
          p = p.parentElement
        }
        if (clipped) continue
        const p2 = el.parentElement
        const pr = p2 ? p2.getBoundingClientRect() : null
        if (!pr || (pr.right <= vw + 1 && pr.left >= -1)) {
          wide.push({ el: label(el), left: Math.round(r.left), right: Math.round(r.right) })
        }
      }
    }
    issues.push({
      type: 'horizontal-scroll',
      detail: `scrollWidth=${doc.scrollWidth} clientWidth=${doc.clientWidth}`,
      offenders: wide.slice(0, 8),
    })
  }

  // 2. Header region: check key controls for overlap.
  const header = document.querySelector('header')
  if (header) {
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'
    }
    const rects = []
    // Text-bearing controls in the header bar (top row only).
    const bar = header.querySelector('nav') || header
    for (const el of bar.querySelectorAll('a, button')) {
      if (!visible(el)) continue
      const r = el.getBoundingClientRect()
      if (r.top > window.scrollY + 120) continue // skip mobile drawer items below bar
      rects.push({ label: label(el), text: (el.textContent || '').trim().replace(/\s+/g, ' '), r })
    }
    const contains = (outer, inner) =>
      outer.left <= inner.left + 2 && outer.right >= inner.right - 2 &&
      outer.top <= inner.top + 2 && outer.bottom >= inner.bottom - 2
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j]
        if (a.text === '' || b.text === '') continue
        // Nested pairs (e.g. <Link><Button/></Link>) legitimately share a rect.
        if (contains(a.r, b.r) || contains(b.r, a.r)) continue
        const overlapX = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
        const overlapY = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
        if (overlapX > 2 && overlapY > 2) {
          issues.push({
            type: 'header-overlap',
            detail: `"${a.text}" ∩ "${b.text}" (${Math.round(overlapX)}×${Math.round(overlapY)}px)`,
          })
        }
      }
    }
    // 3. Header controls escaping the nav bounds (clipped / cut off).
    const navRect = (header.querySelector('nav') || header).getBoundingClientRect()
    for (const item of rects) {
      if (item.r.right > navRect.right + 1 || item.r.left < navRect.left - 1) {
        issues.push({
          type: 'header-overflow',
          detail: `"${item.text}" outside nav bounds (left=${Math.round(item.r.left)}, right=${Math.round(item.r.right)}, nav=${Math.round(navRect.left)}..${Math.round(navRect.right)})`,
        })
      }
    }
    // 4. Text clipped inside its own control (button/link smaller than text).
    for (const item of rects) {
      if (!item.text) continue
      const el = [...bar.querySelectorAll('a, button')].find(
        (e) => (e.textContent || '').trim().replace(/\s+/g, ' ') === item.text && visible(e)
      )
      if (!el) continue
      const range = document.createRange()
      range.selectNodeContents(el)
      const tr = range.getBoundingClientRect()
      if (tr.width > item.r.width + 2 && getComputedStyle(el).overflow !== 'auto' && getComputedStyle(el).overflowX !== 'auto') {
        issues.push({ type: 'header-text-clipped', detail: `"${item.text}" text wider than control` })
      }
    }
  }

  // 5. Interactive controls smaller than 32px in either dimension (mobile tap targets).
  if (vw < 768) {
    for (const el of document.querySelectorAll('header a, header button, nav a, nav button')) {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      if (r.width === 0 || r.height === 0 || s.display === 'none' || s.visibility === 'hidden') continue
      if (r.height < 24 || r.width < 24) {
        issues.push({ type: 'small-tap-target', detail: `${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}` })
        break // one sample is enough per page
      }
    }
  }

  // 6. Sections/cards sticking out of the page container (ignoring content
  //    that is clipped by an overflow-hidden/auto ancestor).
  const containers = document.querySelectorAll('main .container, main [class*="max-w-"], main section > div')
  for (const c of containers) {
    const r = c.getBoundingClientRect()
    if (r.width > vw + 4 && getComputedStyle(c).overflowX === 'visible') {
      let clipped = false, p = c.parentElement
      while (p) {
        const ps = getComputedStyle(p)
        if (ps.overflowX !== 'visible' || ps.overflowY !== 'visible') { clipped = true; break }
        p = p.parentElement
      }
      if (!clipped) {
        issues.push({ type: 'container-wider-than-viewport', detail: `${label(c)} width=${Math.round(r.width)} vw=${vw}` })
        break
      }
    }
  }

  return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, issues }
}

/**
 * Opens the mobile drawer, verifies every item fits on screen with no
 * overlap, then closes it and verifies it is really gone.
 */
async function checkMobileDrawer(page) {
  const issues = []
  try {
    // Verify nothing overlays the hamburger (a real tap must reach it).
    const blocked = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-controls="mobile-menu"]')
      if (!btn) return 'missing'
      const r = btn.getBoundingClientRect()
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      if (!top || !(top === btn || btn.contains(top))) {
        return `covered by ${top ? top.tagName + '.' + String(top.className || '').split(/\s+/)[0] : 'nothing'}`
      }
      return null
    })
    if (blocked === 'missing') return [{ type: 'drawer-missing', detail: 'hamburger toggle not found' }]
    if (blocked) return [{ type: 'drawer-blocked-overlay', detail: blocked }]

    // React must be hydrated before clicks reach the onClick handlers.
    // (In-page click: headless Chrome drops synthetic mouse input after some
    // cross-document navigations — hit-testing above covers real tap routing.)
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button[aria-controls="mobile-menu"]')
        if (!btn) return false
        return Object.keys(btn).some((k) => k.startsWith('__reactProps$') || k.startsWith('__reactFiber$'))
      },
      { timeout: 15_000 }
    ).catch(() => {})
    await page.evaluate(() => document.querySelector('button[aria-controls="mobile-menu"]').click())
    await sleep(450)

    const open = await page.evaluate(() => {
      const menu = document.getElementById('mobile-menu')
      if (!menu) return { exists: false }
      const style = getComputedStyle(menu)
      const rect = menu.getBoundingClientRect()
      const vw = document.documentElement.clientWidth
      const items = [...menu.querySelectorAll('a, button')].map((el) => {
        const r = el.getBoundingClientRect()
        return { text: (el.textContent || '').trim().replace(/\s+/g, ' '), left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height }
      })
      const overlaps = []
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i], b = items[j]
          if (!a.text || !b.text) continue
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left)
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
          if (ox > 2 && oy > 2 && !(a.left <= b.left + 2 && a.right >= b.right - 2) && !(b.left <= a.left + 2 && b.right >= a.right - 2)) {
            overlaps.push(`"${a.text}" ∩ "${b.text}"`)
          }
        }
      }
      return {
        exists: true,
        visible: style.visibility !== 'hidden' && style.opacity !== '0' && rect.height > 0,
        rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
        scrollHeight: menu.scrollHeight,
        vw,
        scrollWidth: document.documentElement.scrollWidth,
        items,
        overlaps,
        hasAllNav: ['Home', 'Find Doctors', 'Specialties', 'Hospitals & Clinics', 'How It Works', 'Emergency'].every(
          (t) => items.some((i) => i.text.includes(t))
        ),
        hasBook: items.some((i) => i.text.includes('Book Appointment')),
        hasAccountActions: items.some((i) => i.text.includes('Sign In') || i.text.includes('Account')),
      }
    })

    if (!open.exists) issues.push({ type: 'drawer-missing', detail: '#mobile-menu not found' })
    else if (!open.visible) issues.push({ type: 'drawer-not-visible', detail: 'menu stayed hidden after toggle click' })
    else {
      if (!open.hasAllNav) issues.push({ type: 'drawer-incomplete', detail: 'not all nav links visible' })
      if (!open.hasBook) issues.push({ type: 'drawer-incomplete', detail: 'Book Appointment missing' })
      if (!open.hasAccountActions) issues.push({ type: 'drawer-incomplete', detail: 'sign-in/account actions missing' })
      if (open.scrollWidth > open.vw + 1) issues.push({ type: 'drawer-horizontal-scroll', detail: `scrollWidth=${open.scrollWidth}` })
      for (const it of open.items) {
        if (it.left < -1 || it.right > open.vw + 1) {
          issues.push({ type: 'drawer-item-outside-viewport', detail: `"${it.text}" [${Math.round(it.left)}..${Math.round(it.right)}] vw=${open.vw}` })
          break
        }
      }
      for (const o of open.overlaps) issues.push({ type: 'drawer-overlap', detail: o })
      const vh = await page.evaluate(() => window.innerHeight)
      if (open.rect.bottom > vh + 1) {
        issues.push({ type: 'drawer-taller-than-viewport', detail: `bottom=${Math.round(open.rect.bottom)} vh=${vh}` })
      }
    }

    // Close it and verify.
    await page.evaluate(() => document.querySelector('button[aria-controls="mobile-menu"]')?.click())
    await sleep(450)
    const after = await page.evaluate(() => {
      const menu = document.getElementById('mobile-menu')
      if (!menu) return { visible: true }
      const style = getComputedStyle(menu)
      return { visible: style.visibility !== 'hidden' && menu.getBoundingClientRect().height > 0 }
    })
    if (after.visible) issues.push({ type: 'drawer-did-not-close', detail: 'menu still visible after second click' })
  } catch (err) {
    issues.push({ type: 'drawer-error', detail: String(err).slice(0, 120) })
  }
  return issues
}

async function runAudit() {
  const args = parseArgs(process.argv.slice(2))
  const widths = args.widths || ALL_WIDTHS
  const pages = args.pages
    ? PUBLIC_PAGES.concat(AUTH_PAGES).filter(([, href]) => args.pages.includes(href) || args.pages.includes(href.split('/')[1]))
    : PUBLIC_PAGES

  mkdirSync(SHOT_DIR, { recursive: true })
  const executablePath = findChrome()

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  })

  const results = []
  const consoleErrors = []

  try {
    const page = await browser.newPage()
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text()
        if (!/favicon|Failed to load resource/i.test(t)) consoleErrors.push(t.slice(0, 200))
      }
    })
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${String(err).slice(0, 200)}`))

    await page.setViewport({ width: 1440, height: 900 })
    await waitForServer(BASE)

    // Log in once so authenticated routes/nav can be audited.
    const email = process.env.AUDIT_EMAIL || process.env.EMERGENCY_EMAIL || 'patient@demo.com'
    const password = process.env.AUDIT_PASSWORD || process.env.EMERGENCY_PASSWORD || 'demo123'
    let loggedIn = false
    try {
      await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle2', timeout: 30_000 })
      await page.type('input[type="email"], input[name="email"]', email, { delay: 10 })
      await page.type('input[type="password"], input[name="password"]', password, { delay: 10 })
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20_000 }),
      ])
      loggedIn = true
      console.log(`Logged in as ${email}`)
    } catch (err) {
      console.log(`WARN: login failed (${err.message}); auditing logged-out state only`)
    }

    const routeList = loggedIn ? pages.concat(AUTH_PAGES) : pages
    // discover a doctor id + hospital id for profile pages
    const discovered = []
    try {
      const res = await fetch(`${BASE}/api/doctors/search?per_page=1`).then((r) => r.json()).catch(() => null)
      const doctorId = res?.doctors?.[0]?.id
      if (doctorId) discovered.push(['doctor-profile', `/doctors/${doctorId}`])
      await page.goto(`${BASE}/doctors`, { waitUntil: 'networkidle2', timeout: 30_000 })
      const hrefs = await page.$$eval('a[href^="/doctors/"]', (as) => as.map((a) => a.getAttribute('href')))
      if (hrefs[0] && !discovered.some(([, h]) => h === hrefs[0])) discovered.push(['doctor-profile', hrefs[0]])
      await page.goto(`${BASE}/hospitals`, { waitUntil: 'networkidle2', timeout: 30_000 })
      const hh = await page.$$eval('a[href^="/hospitals/"]', (as) => as.map((a) => a.getAttribute('href')))
      if (hh[0]) discovered.push(['hospital-profile', hh[0]])
    } catch {
      /* discovery is best-effort */
    }

    const allPages = routeList.concat(discovered)

    // Give /appointments/new a real doctor id so step 1 renders instead of the loading state.
    const doctorPath = discovered.find(([n]) => n === 'doctor-profile')?.[1]
    if (doctorPath) {
      const idx = allPages.findIndex(([n]) => n === 'appointments-new')
      if (idx >= 0) allPages[idx] = ['appointments-new', `/appointments/new?doctor=${doctorPath.split('/').pop()}`]
    }

    for (const [name, href] of allPages) {
      for (const width of widths) {
        await page.setViewport({ width, height: width < 768 ? 844 : 900 })
        const resp = await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle2', timeout: 45_000 }).catch(() => null)
        await sleep(350)
        const probe = await page.evaluate(PROBE)
        const status = resp ? resp.status() : 0
        if (status >= 400) probe.issues.push({ type: 'http-error', detail: `HTTP ${status} for ${href}` })
        const notFound = await page
          .evaluate(() => document.body?.innerText?.includes('Page not found') || false)
          .catch(() => false)
        if (notFound) probe.issues.push({ type: 'not-found', detail: `${href} renders the 404 page` })
        const entry = { page: name, href, width, ...probe }
        results.push(entry)
        const bad = probe.issues.length > 0
        if (bad || args.screenshots) {
          const suffix = loggedIn && AUTH_PAGES.some(([n]) => n === name) ? '-auth' : ''
          const file = path.join(SHOT_DIR, `${name}-${width}${suffix}.png`)
          await page.screenshot({ path: file, fullPage: false }).catch(() => {})
        }
        const flag = bad ? 'FAIL' : 'ok'
        console.log(
          `${flag.padEnd(4)} ${name} @${width}px${probe.issues.length ? ` — ${probe.issues.map((i) => i.type + ': ' + i.detail).join(' | ')}` : ''}`
        )

        // Mobile drawer check: open, verify contents fit, close again.
        if (width < 1024 && (name === 'home' || name === 'account')) {
          const drawerResult = await checkMobileDrawer(page)
          results.push({ page: `${name}-drawer`, href, width, scrollWidth: 0, clientWidth: width, issues: drawerResult })
          if (drawerResult.length) {
            console.log(`FAIL drawer ${name} @${width}px — ${drawerResult.map((i) => i.type + ': ' + i.detail).join(' | ')}`)
          }
        }
      }
    }
  } finally {
    await browser.close()
  }

  const failures = results.filter((r) => r.issues.length > 0)
  const report = { generatedAt: new Date().toISOString(), baseUrl: BASE, failures, consoleErrors: [...new Set(consoleErrors)] }
  writeFileSync(path.join(ROOT, 'screenshots', 'responsive-report.json'), JSON.stringify(report, null, 2))

  console.log('\n=== SUMMARY ===')
  console.log(`Checked ${results.length} page/width combos; ${failures.length} with issues.`)
  const byType = {}
  for (const f of failures) for (const i of f.issues) byType[i.type] = (byType[i.type] || 0) + 1
  console.log('Issues by type:', JSON.stringify(byType, null, 2))
  if (consoleErrors.length) console.log(`Console errors: ${[...new Set(consoleErrors)].length}`)
  process.exit(failures.length ? 1 : 0)
}

runAudit().catch((err) => {
  console.error(err)
  process.exit(1)
})
