// api/generate-qr.js
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

    // Create your custom HTML page with embedded QR image
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            width: ${templateWidth}px;
            height: ${templateHeight}px;
            overflow: hidden;
          }
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
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
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
          .qr-image {
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
            font-weight: 500;
          }
          .footer .url {
            font-size: 12px;
            opacity: 0.8;
            word-break: break-all;
            padding: 0 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
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
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}" 
                 class="qr-image" 
                 alt="QR Code" />
          </div>
          
          <div class="footer">
            <div class="brand">🚀 Powered by Your Custom QR Generator</div>
            <div class="url">${url.length > 60 ? url.substring(0, 57) + '...' : url}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Launch puppeteer in production mode
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (isDev) {
      // Local development
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } else {
      // Production on Vercel
      browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        headless: true
      });
    }

    const page = await browser.newPage();
    
    // Set viewport to exact size
    await page.setViewport({ 
      width: templateWidth, 
      height: templateHeight,
      deviceScaleFactor: 2 // Higher quality
    });
    
    // Set content and wait for images to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Wait a bit more to ensure QR image is fully loaded
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: templateWidth,
        height: templateHeight
      }
    });

    // Return the screenshot
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(screenshot);

  } catch (error) {
    console.error('Error generating QR code:', error);
    
    // Fallback: redirect to basic QR API
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
    res.redirect(302, fallbackUrl);
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
} <!-- image -->
        <image x="${(templateWidth - qrSize) / 2}" y="120" width="${qrSize}" height="${qrSize}" 
               href="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&amp;data=${encodeURIComponent(url)}" />
        
        <!-- Footer text -->
        <text x="${templateWidth / 2}" y="${120 + qrSize + 80}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="white">Powered by Your Custom QR Generator</text>
        <text x="${templateWidth / 2}" y="${120 + qrSize + 100}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)">${url.length > 50 ? url.substring(0, 47) + '...' : url}</text>
      </svg>
    `;

    // Convert SVG to PNG using a conversion service
    const convertUrl = `https://svg2png.com/api/v1/convert`;
    
    try {
      const convertResponse = await fetch(convertUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          svg: svg,
          format: 'png',
          width: templateWidth,
          height: templateHeight
        })
      });

      if (convertResponse.ok) {
        const pngBuffer = await convertResponse.arrayBuffer();
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.send(Buffer.from(pngBuffer));
        return;
      }
    } catch (conversionError) {
      console.log('SVG conversion failed, falling back to SVG response');
    }

    // Fallback: Return SVG (which works as image in most platforms)
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(Buffer.from(svg));

  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}
