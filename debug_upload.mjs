import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  fs.writeFileSync('test.csv', 'cliente_nome,cliente_telefone\nJoão,123456\n');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:8080/importar', { waitUntil: 'networkidle0' });
  
  const inputUploadHandle = await page.input[type=file];
  await inputUploadHandle.uploadFile('test.csv');
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
