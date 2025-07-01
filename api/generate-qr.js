// api/generate-qr.js
import { createCanvas } from 'canvas';
import QRCode from 'qrcode';

export default async function handler(req, res) {
  const { url, size = 300 } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(url, {
      width: parseInt(size),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create canvas for custom template
    const templateWidth = parseInt(size) * 1.6;
    const templateHeight = parseInt(size) * 1.8;
    const canvas = createCanvas(templateWidth, templateHeight);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, templateWidth, templateHeight);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, templateWidth, templateHeight);

    // Add decorative elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * templateWidth;
      const y = Math.random() * templateHeight;
      const radius = Math.random() * 30 + 10;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add header section
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(20, 20, templateWidth - 40, 80);

    // Add title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Scan QR Code', templateWidth / 2, 55);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Point your camera at the code below', templateWidth / 2, 80);

    // Add white background for QR code
    const qrPadding = 30;
    const qrX = (templateWidth - parseInt(size)) / 2;
    const qrY = 120;

    ctx.fillStyle = 'white';
    ctx.fillRect(qrX - qrPadding, qrY - qrPadding, parseInt(size) + qrPadding * 2, parseInt(size) + qrPadding * 2);

    // Load and draw QR code
    const qrImage = await loadImage(qrDataURL);
    ctx.drawImage(qrImage, qrX, qrY, parseInt(size), parseInt(size));

    // Add footer text
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    const footerY = qrY + parseInt(size) + qrPadding + 40;
    ctx.fillText('Powered by Your Custom QR Generator', templateWidth / 2, footerY);

    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const truncatedUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
    ctx.fillText(truncatedUrl, templateWidth / 2, footerY + 25);

    // Return image
    const buffer = canvas.toBuffer('image/png');
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);

  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}

// Helper function to load image
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
