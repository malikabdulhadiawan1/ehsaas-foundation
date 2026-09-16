const { chromium } = require('C:/Users/Computer/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const width of [390, 468]) {
    const context = await browser.newContext({ viewport: { width, height: 700 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8765/about-us.html', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: '../header-' + width + '.png' });
    const metrics = await page.evaluate(() => ({
      header: document.querySelector('#header').getBoundingClientRect().toJSON(),
      logo: document.querySelector('#sitename').getBoundingClientRect().toJSON(),
      menu: document.querySelector('.nav-trigger').getBoundingClientRect().toJSON(),
      search: document.querySelector('.ef-search').getBoundingClientRect().toJSON()
    }));
    console.log(width, JSON.stringify(metrics));
    await context.close();
  }
  await browser.close();
})();
