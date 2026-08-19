const { Jimp } = require('jimp');
const path = require('path');

async function createFavicon() {
  const inputPath = path.join('C:\\Users\\Valdeir\\.gemini\\antigravity\\brain\\1392cffa-b7e3-41a6-97f5-cbea9f5b957b\\.user_uploaded', 'media_1786730147884.png');
  const outputPath = path.join(__dirname, 'app', 'icon.png');

  try {
    const image = await Jimp.read(inputPath);
    
    // Get dimensions
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // We want a square image based on the largest dimension
    const size = Math.max(width, height);
    
    // Create a new blank square image with transparent background
    // In Jimp, background is 0x00000000 by default (transparent black)
    const background = new Jimp({ width: size, height: size, color: 0x00000000 });
    
    // Calculate x and y to center the original image
    const x = Math.floor((size - width) / 2);
    const y = Math.floor((size - height) / 2);
    
    // Composite the original image onto the center of the transparent square
    background.composite(image, x, y);
    
    await background.write(outputPath);
    console.log('Successfully created square app/icon.png');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

createFavicon();
