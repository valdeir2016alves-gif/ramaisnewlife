const { Jimp } = require('jimp');
const path = require('path');

async function invertLogo() {
  const inputPath = path.join(__dirname, 'public', 'logo.png');
  const outputPath = path.join(__dirname, 'public', 'logo-white.png');

  try {
    const image = await Jimp.read(inputPath);
    // Invert the image colors
    image.invert();
    await image.write(outputPath);
    console.log('Successfully created logo-white.png');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

invertLogo();
