import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const { title = "Hello", subtitle = "Generated with HTML", width = 600, height = 800 } = req.query;

  const templateWidth = parseInt(width);
  const templateHeight = parseInt(height);

  let browser = null;

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            margin: 0;
            padding: 0;
            width: ${templateWidth}px;
            height: ${templateHeight}px;
            background: linear-gradient(to bottom right, #667eea, #764ba2);
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            font-family: Arial, sans-serif;
            color: white;
          }
          h1 { font-size: 36px; margin: 0; }
          p { font-size: 18px; opacity: 0.85; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </body>
      </html>
    `;

    const executablePath = chromium.executablePath;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: templateWidth,
        height: templateHeight,
        deviceScaleFactor: 1
      },
      executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: templateWidth, height: templateHeight }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(screenshot);
  } catch (err) {
    console.error('Image generation failed:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
}
