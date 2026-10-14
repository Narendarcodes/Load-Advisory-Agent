// Playwright check of the /voice caption contrast as rendered (WCAG AA >= 4.5:1 for the small caption text).
//   BASE=http://127.0.0.1:8095 OUT=./shots node tests/e2e/voice_contrast.mjs
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
const BASE = process.env.BASE || 'http://127.0.0.1:8095'
const OUT = process.env.OUT || 'shots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } })
await page.goto(BASE + '/voice')
const r = await page.evaluate(() => {
  add('u', 'Why was my loan application rejected?', 'you (speech-to-text)')
  add('a', 'Your recorded decision is REJECTED.', 'intent: explain · action: answer')
  const rgb = s => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)
  const lum = c => { const l = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2] }
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  const out = {}
  for (const cls of ['u', 'a']) {
    const bubble = document.querySelector(`.msg.${cls}:last-of-type`) || [...document.querySelectorAll(`.msg.${cls}`)].pop()
    const meta = bubble.querySelector('.meta')
    out[cls] = { caption: getComputedStyle(meta).color, bubble: getComputedStyle(bubble).backgroundColor,
                 ratio: +ratio(rgb(getComputedStyle(meta).color), rgb(getComputedStyle(bubble).backgroundColor)).toFixed(2) }
  }
  return out
})
await page.locator('#log').screenshot({ path: `${OUT}/voice-captions.png` })
await browser.close()
const ok = r.u.ratio >= 4.5 && r.a.ratio >= 4.5
writeFileSync(`${OUT}/voice_contrast.json`, JSON.stringify({ ok, ...r }, null, 1))
console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(r))
process.exit(ok ? 0 : 1)
