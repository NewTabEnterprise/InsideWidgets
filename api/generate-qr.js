import chromium from 'chrome-aws-lambda';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer'; // fallback for local

export default async function handler(req, res) {
  const { title = "Hello", subtitle = "This is a test", width = 600, height = 800 } = req.query;

  const templateWidth = parseInt(width);
  const templateHeight = parseInt(height);

  const isProduction = !!process.env.AWS_REGION;

  let browser;

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              width: ${templateWidth}px;
              height: ${templateHeight}px;
              margin: 0;
              padding: 0;
              background: linear-gradient(135deg, #667eea, #764ba2);
              display: flex;
              justify-content: center;
              align-items: center;
              flex-direction: column;
              color: white;
              font-family: sans-serif;
            }
            h1 { font-size: 32px; }
            p { font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </body>
      </html>
    `;

    const executablePath = isProduction
      ? await chromium.executablePath
      : puppeteer.executablePath(); // <- force local fallback

    browser = await (isProduction ? puppeteerCore : puppeteer).launch({
      args: isProduction ? chromium.args : [],
      headless: true,
      executablePath,
      defaultViewport: {
        width: templateWidth,
        height: templateHeight,
        deviceScaleFactor: 1
      }
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
    console.error('Render Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
}
