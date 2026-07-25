import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = 'C:\\Users\\User\\Pictures\\底片';
const DEST_DIR = path.resolve(__dirname, '../public/images/gallery');
const JSON_DEST = path.resolve(__dirname, '../public/data/photos.json');

// Concurrency limit for batch image processing
const CONCURRENCY_LIMIT = 8;

/**
 * Sanitize folder/category string into safe ID.
 * @param {string} name - Raw folder name.
 * @returns {string} Sanitized ID.
 */
function sanitizeId(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-').replace(/^-+|-+$/g, '');
}

// Ensure dest folder exists
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

async function run() {
  console.log(`Scanning source directory: ${SOURCE_DIR}`);
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory does not exist: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
  const categoryMap = new Map();
  let existingPhotos = [];
  let maxSortOrder = 0;

  if (fs.existsSync(JSON_DEST)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(JSON_DEST, 'utf8'));
      if (existingData.categories) {
        existingData.categories.forEach(c => categoryMap.set(c.id, c));
      }
      if (existingData.photos) {
        existingPhotos = existingData.photos;
        maxSortOrder = existingPhotos.reduce((max, p) => Math.max(max, p.sortOrder || p.id), 0);
      }
      console.log(`Loaded ${existingPhotos.length} existing photos from photos.json`);
    } catch (e) {
      console.warn("Could not read existing photos.json, starting fresh.", e);
    }
  }

  const tasks = [];

  // Default 'all' category
  if (!categoryMap.has('all')) {
    categoryMap.set('all', { id: 'all', name: 'All' });
  }

  // Gather all photo paths with their category information
  for (const entry of entries) {
    const fullPath = path.join(SOURCE_DIR, entry.name);
    if (entry.isDirectory()) {
      const folderName = entry.name;
      const catId = sanitizeId(folderName) || `cat-${categoryMap.size}`;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { id: catId, name: folderName });
      }

      const files = fs.readdirSync(fullPath, { withFileTypes: true });
      for (const file of files) {
        if (!file.isDirectory() && /\.(jpg|jpeg|png|webp|tif|tiff|bmp)$/i.test(file.name)) {
          tasks.push({
            filePath: path.join(fullPath, file.name),
            filename: file.name,
            folderName: folderName,
            catId: catId
          });
        }
      }
    } else if (/\.(jpg|jpeg|png|webp|tif|tiff|bmp)$/i.test(entry.name)) {
      const catId = 'uncategorized';
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { id: catId, name: 'Uncategorized' });
      }
      tasks.push({
        filePath: fullPath,
        filename: entry.name,
        folderName: 'Uncategorized',
        catId: catId
      });
    }
  }

  console.log(`Found ${tasks.length} photos across ${categoryMap.size - 1} subdirectories.`);

  const photos = [...existingPhotos];
  let completedCount = 0;

  // Process batch with concurrency pool
  async function worker(taskItem, index) {
    const sortOrder = maxSortOrder + index + 1;
    const rawBasename = path.parse(taskItem.filename).name;
    const cleanFolderName = taskItem.folderName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const destFilename = `${cleanFolderName}_${rawBasename}_${sortOrder}.webp`;
    const destPath = path.join(DEST_DIR, destFilename);

    try {
      const image = sharp(taskItem.filePath);
      const metadata = await image.metadata();
      const width = metadata.width || 1920;
      const height = metadata.height || 1080;
      const aspectRatio = width / height;

      // 1. Resize and save main WebP image
      await image
        .resize({
          width: width >= height ? (width > 1920 ? 1920 : undefined) : undefined,
          height: height > width ? (height > 1920 ? 1920 : undefined) : undefined,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 82 })
        .toFile(destPath);

      // 2. Generate LQIP Base64 thumbnail placeholder
      const thumbBuffer = await sharp(taskItem.filePath)
        .resize(20)
        .webp({ quality: 30 })
        .toBuffer();
      const thumbBase64 = `data:image/webp;base64,${thumbBuffer.toString('base64')}`;

      photos.push({
        id: sortOrder,
        src: `/images/gallery/${destFilename}`,
        url: `/images/gallery/${destFilename}`,
        thumb: thumbBase64,
        placeholder: thumbBase64,
        title: rawBasename,
        category: taskItem.catId,
        categoryName: taskItem.folderName,
        width: width > 1920 ? (width >= height ? 1920 : Math.round(1920 * aspectRatio)) : width,
        height: height > 1920 ? (height > width ? 1920 : Math.round(1920 / aspectRatio)) : height,
        aspectRatio: aspectRatio,
        sortOrder: sortOrder
      });

      completedCount++;
      if (completedCount % 100 === 0 || completedCount === tasks.length) {
        console.log(`Progress: [${completedCount}/${tasks.length}] photos converted...`);
      }
    } catch (err) {
      console.error(`Error processing photo ${taskItem.filePath}:`, err.message);
    }
  }

  // Execute tasks in parallel pool
  for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
    const chunk = tasks.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(chunk.map((item, chunkIdx) => worker(item, i + chunkIdx)));
  }

  // Sort photos by sortOrder
  photos.sort((a, b) => (a.sortOrder || a.id) - (b.sortOrder || b.id));

  // Generate categories list
  const categoriesList = Array.from(categoryMap.values());

  const outputData = {
    categories: categoriesList,
    photos: photos
  };

  console.log(`Writing photos metadata to ${JSON_DEST}...`);
  fs.writeFileSync(JSON_DEST, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`Optimization complete! Successfully processed ${photos.length} photos into WebP format.`);
}

run().catch((err) => {
  console.error('Fatal error in optimization script:', err);
  process.exit(1);
});
