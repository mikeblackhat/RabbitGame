const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(1000);
  
  const startBtnVisible = await page.evaluate(() => {
    const btn = document.querySelector('#startButton');
    if (!btn) return false;
    const style = window.getComputedStyle(btn);
    return style.display !== 'none' && style.opacity !== '0';
  });
  
  console.log('Start button visible:', startBtnVisible);
  await browser.close();
})();
