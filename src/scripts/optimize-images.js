// Script to optimize PNG images for web use
// To use this script: 
// 1. Install Sharp: npm install sharp
// 2. Run: node src/scripts/optimize-images.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '../../public');
const BRAND_DIR = path.join(PUBLIC_DIR, 'assets/brand');
const OUTPUT_DIR = BRAND_DIR;

// Make sure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// List of images to optimize
const images = [
  {
    input: path.join(BRAND_DIR, 'gandall-logo.png'),
    output: path.join(OUTPUT_DIR, 'gandall-logo.png'),
    width: 180, // Smaller width for better fit in sidebar
    quality: 80 // 0-100, higher is better quality but larger file
  },
  {
    input: path.join(BRAND_DIR, 'gandall-logo-small.png'),
    output: path.join(OUTPUT_DIR, 'gandall-logo-small.png'),
    width: 50, // Small size for mobile header
    quality: 80
  },
  {
    input: path.join(BRAND_DIR, 'favicon.png'),
    output: path.join(OUTPUT_DIR, 'favicon.png'),
    width: 64,
    quality: 80
  },
  {
    input: path.join(BRAND_DIR, 'logo192.png'),
    output: path.join(OUTPUT_DIR, 'logo192.png'),
    width: 192,
    quality: 80
  },
  {
    input: path.join(BRAND_DIR, 'logo512.png'),
    output: path.join(OUTPUT_DIR, 'logo512.png'),
    width: 512,
    quality: 80
  }
];

// Optimize images
async function optimizeImages() {
  for (const image of images) {
    try {
      if (fs.existsSync(image.input)) {
        console.log(`Optimizing: ${image.input}`);
        
        await sharp(image.input)
          .resize({ width: image.width })
          .png({ quality: image.quality, compressionLevel: 9, palette: true })
          .toFile(image.output);
        
        // Get file sizes for comparison
        const originalSize = fs.statSync(image.input).size;
        const optimizedSize = fs.statSync(image.output).size;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
        
        console.log(`✅ Optimized: ${image.output}`);
        console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(2)} KB`);
        console.log(`   Savings: ${savings}%`);
      } else {
        console.log(`⚠️ File not found: ${image.input}`);
      }
    } catch (error) {
      console.error(`❌ Error optimizing ${image.input}:`, error);
    }
  }
}

// Run optimization
optimizeImages().then(() => {
  console.log('Image optimization complete!');
}).catch(err => {
  console.error('Error during image optimization:', err);
});
