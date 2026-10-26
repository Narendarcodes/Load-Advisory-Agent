// Playwright smoke test of the applicant chat UI (apps/web/chat/index.html) against a running advisory server.
//   BASE=http://127.0.0.1:8095 OUT=./shots node tests/e2e/chat_smoke.mjs
// Needs the `playwright` package and a Chromium build (npx playwright install chromium). Exits non-zero on failure.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.env.BASE || 'http://127.0.0.1:8095'
const OUT = process.env.OUT || 'shots'
mkdirSync(OUT, { recursive: true })
const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, detail) }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, recordVideo: process.env.VIDEO ? { dir: OUT, size: { width: 1360, height: 900 } } : undefined })
const page = await ctx.newPage()
const consoleErrors = []
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })

async function ask(text) {
  const before = await page.locator('.msg.bot[data-intent]').count()
  await page.fill('#msg', text)
  await page.click('#send')
  await page.waitForFunction(n => document.querySelectorAll('.msg.bot[data-intent]').length > n, before, { timeout: 120000 })
  const bot = page.locator('.msg.bot[data-intent]').last()
  return { el: bot, intent: await bot.getAttribute('data-intent'), action: await bot.getAttribute('data-action'), text: await bot.innerText() }
}

await page.goto(BASE)
await page.screenshot({ path: `${OUT}/01-signin.png` })
await page.selectOption('#acct', 'SYN-APP-00000')
await page.selectOption('#lit', 'low')
await page.click('#go')
await page.waitForSelector('#decision-badge')
const badge = await page.innerText('#decision-badge')
check('decision card shows recorded decision', badge === 'REJECTED', badge)
const fails = await page.locator('#decision td.r-FAIL').count()
check('decision card lists 3 failed checks (FOIR, score, tenure)', fails === 3, `${fails}`)
check('synthetic-threshold label visible', await page.locator('#decision .badge.syn').count() === 1)
await page.screenshot({ path: `${OUT}/02-decision-card.png` })

let r = await ask('Why was my loan rejected?')
check('explain routed', r.intent === 'explain', r.intent)
check('explain mentions the credit score value 689', r.text.includes('689'))
check('explain says synthetic', /synthetic|prototype/i.test(r.text))
await page.screenshot({ path: `${OUT}/03-explain-low-literacy.png`, fullPage: true })

r = await ask('What can I do to improve before reapplying?')
check('improve routed', r.intent === 'improve', r.intent)
const steps = await page.locator('#plan li').count()
check('improvement plan panel has 3 steps', steps === 3, `${steps}`)
await page.screenshot({ path: `${OUT}/04-improvement-plan.png`, fullPage: true })

r = await ask('What if my credit score was 720?')
check('what-if routed and simulated', r.intent === 'what_if' && r.action === 'simulate', `${r.intent}/${r.action}`)
check('decision card still REJECTED after what-if', (await page.innerText('#decision-badge')) === 'REJECTED')
await page.screenshot({ path: `${OUT}/05-what-if.png`, fullPage: true })

r = await ask('How do I raise a complaint with the lender?')
const cites = await r.el.locator('.cites').count()
check('policy answer has citations', r.intent === 'policy' && cites === 1, `${r.intent} cites=${cites}`)
check('lender relationship label on citation', /not a partner/i.test(r.text))
await page.screenshot({ path: `${OUT}/06-policy-citations.png`, fullPage: true })

r = await ask('Will I definitely get approved if I reapply?')
check('guarantee request refused', r.intent === 'boundary' && r.action === 'refuse', `${r.intent}/${r.action}`)
check('no guarantee language', !/you will (definitely )?be approved/i.test(r.text))
await page.screenshot({ path: `${OUT}/07-guarantee-refused.png`, fullPage: true })

r = await ask('What is the cheapest personal loan in India right now?')
check('unanswerable policy question abstains', /abstained/.test(r.text) || r.action === 'refuse', r.action)
await page.screenshot({ path: `${OUT}/08-abstain.png`, fullPage: true })

// QA 2026-10-26 (D5): switching the applicant dropdown after sign-in signs out instead of answering about the old file
const otherRef = await page.$eval('#acct', s => [...s.options].map(o => o.value).find(v => v !== s.value))
await page.selectOption('#acct', otherRef)
check('switching applicant signs out (chat disabled, card cleared)', await page.isDisabled('#msg') && (await page.locator('#decision-badge').count()) === 0)
await page.click('#go')
await page.waitForSelector('#decision-badge')
check('signing in again shows the newly selected applicant', (await page.innerText('#decision .note')).includes(otherRef), otherRef)

check('no browser console errors', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 300))
await ctx.close(); await browser.close()
writeFileSync(`${OUT}/smoke_results.json`, JSON.stringify(results, null, 1))
const failed = results.filter(x => !x.ok).length
console.log(`${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
