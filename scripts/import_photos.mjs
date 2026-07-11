import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import imageSize from 'image-size';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = 'C:\\Users\\User\\Pictures\\Camera Roll\\0408-448192';
const DEST_DIR = path.resolve(__dirname, '../public/images/gallery');
const JSON_DEST = path.resolve(__dirname, '../public/data/photos.json');

// 1. Delete old photos
console.log('Cleaning up old photos...');
if (fs.existsSync(DEST_DIR)) {
  const files = fs.readdirSync(DEST_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(DEST_DIR, file));
  }
} else {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// 2. Scan and copy files
console.log(`Scanning source directory: ${SOURCE_DIR}`);
const photos = [];
let sortOrder = 1;

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      console.log(`Copying ${entry.name}...`);
      const destPath = path.join(DEST_DIR, entry.name);
      fs.copyFileSync(fullPath, destPath);
      
      // Get dimensions
      const buffer = fs.readFileSync(destPath);
      const dimensions = imageSize(buffer);
      const width = dimensions.width;
      const height = dimensions.height;
      const aspectRatio = width / height;

      // Create photo data
      photos.push({
        id: sortOrder,
        url: `/images/gallery/${entry.name}`,
        src: `/images/gallery/${entry.name}`,
        title: '',
        description: '',
        category: 'recent',
        hero: sortOrder <= 3, // First 3 are hero/wow photos
        aspectRatio: aspectRatio,
        sortOrder: sortOrder
      });
      sortOrder++;
    }
  }
}

processDirectory(SOURCE_DIR);

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
console.log('Import complete! Successfully imported', photos.length, 'photos.');
