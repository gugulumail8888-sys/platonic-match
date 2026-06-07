const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"], input[name="email"]', 'test@amista.jp');
  await page.fill('input[type="password"], input[name="password"]', 'test1234');
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForSelector('text=新着会員', { timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dashboard_screenshot.png', fullPage: true });

  const newMembersSection = await page.locator('text=新着会員').locator('..').locator('..').innerText().catch(() => '(not found)');
  console.log('--- 新着会員 section text ---');
  console.log(newMembersSection);
  console.log('--- console errors ---');
  console.log(errors.length ? errors.join('\n') : '(none)');

  await browser.close();
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
