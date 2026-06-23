const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = 'assets';
let converted = 0;
let failed = 0;

async function convertFile(filePath) {
  const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  try {
    await sharp(filePath)
      .webp({ quality: 85 })
      .toFile(webpPath);
    fs.unlinkSync(filePath); // PNG'yi sil
    converted++;
    if (converted % 20 === 0) console.log(`${converted} dosya dönüştürüldü...`);
  } catch (e) {
    console.error('Hata:', filePath, e.message);
    failed++;
  }
}

async function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath);
    } else if (/\.(png|jpg|jpeg)$/i.test(entry.name)) {
      await convertFile(fullPath);
    }
  }
}

async function main() {
  console.log('PNG → WebP dönüşümü başlıyor...');
  await walkDir(assetsDir);
  console.log(`\nTamamlandı! ${converted} dosya dönüştürüldü, ${failed} hata.`);
  console.log('\nŞimdi generate-manifest.js çalıştır:');
  console.log('node generate-manifest.js');
}

main();
