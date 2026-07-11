import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = 'C:\\Users\\User\\Pictures\\Camera Roll\\0408-448192';
const DEST_DIR = path.resolve(__dirname, '../public/images/gallery');
const JSON_DEST = path.resolve(__dirname, '../public/data/photos.json');

// 1. Clean up dest folder
console.log('Cleaning up destination directory...');
if (fs.existsSync(DEST_DIR)) {
  const files = fs.readdirSync(DEST_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(DEST_DIR, file));
  }
} else {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// 2. Scan and process files recursively
console.log(`Scanning source directory: ${SOURCE_DIR}`);
const photos = [];
let sortOrder = 1;

async function processFile(fullPath, filename) {
  const basename = path.parse(filename).name;
  const destFilename = `${basename}.webp`;
  const destPath = path.join(DEST_DIR, destFilename);

  try {
    // Read image metadata
    const image = sharp(fullPath);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;
    const aspectRatio = width / height;

    console.log(`Processing [${sortOrder}] ${filename} (${width}x${height}, aspect: ${aspectRatio.toFixed(2)})`);

    // A. Generate main webp image (max 1920px)
    await image
      .resize({
        width: width > height ? 1920 : undefined,
        height: height >= width ? 1920 : undefined,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(destPath);

    // B. Generate tiny Base64 blur placeholder (20px width)
    const thumbBuffer = await sharp(fullPath)
      .resize(20) // 20px wide
      .webp({ quality: 30 })
      .toBuffer();
    const thumbBase64 = `data:image/webp;base64,${thumbBuffer.toString('base64')}`;

    photos.push({
      id: sortOrder,
      url: `/images/gallery/${destFilename}`,
      src: `/images/gallery/${destFilename}`,
      thumb: thumbBase64,
      title: '',
      description: '',
      category: 'recent',
      hero: sortOrder <= 3, // First 3 are hero/wow photos
      aspectRatio: aspectRatio,
      sortOrder: sortOrder
    });
    sortOrder++;
  } catch (err) {
    console.error(`Error processing ${filename}:`, err);
  }
}

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      await processFile(fullPath, entry.name);
    }
  }
}

async function run() {
  await processDirectory(SOURCE_DIR);
  
  // Sort photos by sortOrder
  photos.sort((a, b) => a.sortOrder - b.sortOrder);

  // 3. Generate JSON
  console.log('Generating photos.json...');
  const data = {
    categories: [
      { id: 'all', name: 'All' },
      { id: 'recent', name: 'Recent Uploads' }
    ],
    photos: photos
  };

  fs.writeFileSync(JSON_DEST, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Optimization complete! Successfully processed ${photos.length} photos.`);
}

run().catch(err => {
  console.error('Fatal error in optimization script:', err);
});
