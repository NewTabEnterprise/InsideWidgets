import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const { title = "Custom Title", subtitle = "Generated Image", width = 600, height = 800 } = req.query;

  const templateWidth = parseInt(width);
  const templateHeight = parseInt(height);
  const isProduction = !!process.env.AWS_REGION;

  let browser = null;

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: ${templateWidth}px;
            height: ${templateHeight}px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(to bottom right, #667eea, #764ba2);
            font-family: Arial, sans-serif;
            color: white;
          }
          h1 {
            font-size: 32px;
            margin-bottom: 10px;
          }
          p {
            font-size: 18px;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </body>
      </html>
    `;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: templateWidth,
        height: templateHeight,
        deviceScaleFactor: 1,
      },
      executablePath: isProduction
        ? await chromium.executablePath
        : undefined,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000,
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
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
}
