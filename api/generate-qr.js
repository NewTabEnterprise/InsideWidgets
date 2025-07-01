// pages/api/generate-qr.js (or api/generate-qr.js)
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const { url, size = 300 } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  let browser = null;

  try {
    const qrSize = parseInt(size);
    const templateWidth = Math.round(qrSize * 1.6);
    const templateHeight = Math.round(qrSize * 1.8);

    const htmlContent = `...`; // keep your current HTML template as-is

    // Launch Puppeteer with the Vercel-compatible Chromium binary
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: templateWidth,
        height: templateHeight,
        deviceScaleFactor: 1,
      },
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForSelector('.qr-container img', { timeout: 10000 });
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const img = document.querySelector('.qr-container img');
        if (img.complete) resolve();
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      });
    });

    const screenshot = await page.screenshot({
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: templateWidth,
        height: templateHeight,
      },
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(screenshot);
  } catch (error) {
    console.error('Error generating QR code:', error);
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
    res.status(302).setHeader('Location', fallbackUrl).end();
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
