// api/generate-qr.js
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  const { url, size = 300 } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  let browser = null;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    const qrSize = parseInt(size);
    const templateWidth = qrSize * 1.6;
    const templateHeight = qrSize * 1.8;

    // Create HTML content with your custom design
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          .container {
            width: ${templateWidth}px;
            height: ${templateHeight}px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        <div class="container">
          <!-- Decorative circles -->
          ${Array.from({length: 20}, (_, i) => {
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
            <canvas id="qr"></canvas>
          </div>
          
          <div class="footer">
            <div class="brand">Powered by Your Custom QR Generator</div>
            <div class="url">${url.length > 50 ? url.substring(0, 47) + '...' : url}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.setViewport({ width: templateWidth, height: templateHeight });
    
    // Wait for QR code to generate
    await page.waitForTimeout(1000);

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(screenshot);

  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
