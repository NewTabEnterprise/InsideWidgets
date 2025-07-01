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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${templateWidth}px;
            height: ${templateHeight}px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
            position: relative;
            overflow: hidden;
          }
          
          .decorative-circle {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
          }
          
          .header {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            height: 80px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            color: #333;
          }
          
          .header p {
            margin: 5px 0 0 0;
            font-size: 16px;
            color: #666;
          }
          
          .qr-container {
            position: absolute;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          }
          
          .qr-container img {
            display: block;
            width: ${qrSize}px;
            height: ${qrSize}px;
          }
          
          .footer {
            position: absolute;
            bottom: 40px;
            left: 0;
            right: 0;
            text-align: center;
            color: white;
          }
          
          .footer .brand {
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .footer .url {
            font-size: 12px;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <!-- Decorative circles -->
        ${Array.from({length: 20}, () => {
          const x = Math.random() * templateWidth;
          const y = Math.random() * templateHeight;
          const radius = Math.random() * 30 + 10;
          return `<div class="decorative-circle" style="left: ${x}px; top: ${y}px; width: ${radius*2}px; height: ${radius*2}px;"></div>`;
        }).join('')}
        
        <div class="header">
          <h1>Scan QR Code</h1>
          <p>Point your camera at the code below</p>
        </div>
        
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}" alt="QR Code" />
        </div>
        
        <div class="footer">
          <div class="brand">Powered by Your Custom QR Generator</div>
          <div class="url">${url.length > 50 ? url.substring(0, 47) + '...' : url}</div>
        </div>
      </body>
      </html>
    `;

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
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
