const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:8081";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login?redirect-to=%2Fborrower`, { waitUntil: "load" });
  await page.fill("#email", process.env.BORROWER_EMAIL);
  await page.fill("#password", process.env.BORROWER_PASSWORD);
  await page.click("#login-button");
  await page.waitForURL("**/borrower", { timeout: 45000 });
  await page.goto(`${BASE}/borrower/kyc`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const out = await page.evaluate(() => {
    const card = document.querySelector(".identity-card");
    if (!card) return { error: "no .identity-card on this page variant" };
    const cs = getComputedStyle(card);
    const focusables = card.querySelectorAll(
      'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"]),[role="button"],[role="link"]',
    );
    const pageLink = document.querySelector(".kyc a.btn, .kyc-step a");
    return {
      cardPresent: true,
      backgroundImage: cs.backgroundImage,
      backgroundColor: cs.backgroundColor,
      color: cs.color,
      borderRadius: cs.borderRadius,
      padding: cs.padding,
      boxShadow: cs.boxShadow.slice(0, 60),
      focusablesInsideCard: focusables.length,
      focusablesInsideCardTags: [...focusables].map((f) => f.tagName),
      cardRect: { w: Math.round(card.getBoundingClientRect().width), h: Math.round(card.getBoundingClientRect().height) },
      siblingFocusSample: pageLink
        ? { sel: pageLink.className, outline: getComputedStyle(pageLink).outlineColor, outlineWidth: getComputedStyle(pageLink).outlineWidth }
        : null,
      pageScrollHeight: document.documentElement.scrollHeight,
    };
  });
  console.log(JSON.stringify(out, null, 2));
  await ctx.close();
  await b.close();
})().catch((e) => { console.error("probe failed:", e); process.exit(1); });
