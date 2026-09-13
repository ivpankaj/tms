import { chromium } from 'playwright';

async function inspect() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  // Go to login first
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@cookmywork.com');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Navigate to settings
  await page.goto('http://localhost:3000/settings');
  await page.waitForTimeout(2000);

  // Measure main and child heights
  const info = await page.evaluate(() => {
    const main = document.querySelector('main');
    const mainScrollHeight = main ? main.scrollHeight : 0;
    const mainClientHeight = main ? main.clientHeight : 0;
    
    // Check all children of main
    const children = Array.from(main ? main.querySelectorAll('*') : []).map(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        id: el.id,
        className: el.className ? String(el.className).slice(0, 50) : '',
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        display: style.display,
        visibility: style.visibility,
        hidden: el.hidden
      };
    }).filter(x => x.height > 100);

    return {
      mainScrollHeight,
      mainClientHeight,
      tallElements: children
    };
  });

  console.log('Main Scroll Height:', info.mainScrollHeight, 'Client Height:', info.mainClientHeight);
  console.log('Tall elements:', JSON.stringify(info.tallElements.slice(0, 15), null, 2));

  await browser.close();
}

inspect().catch(console.error);
