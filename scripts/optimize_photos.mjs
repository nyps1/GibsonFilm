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

const HERO_IDS = ['000024660034', '000059490021', '000052680022'];

/**
 * 將資料夾或分類名稱轉換為安全的 URL/ID 字串。
 * @param {string} name - 原始資料夾名稱。
 * @returns {string} 正規化後的分類識別碼。
 */
function sanitizeId(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-').replace(/^-+|-+$/g, '');
}

/**
 * 產生照片的唯一業務複合鍵（分類 ID + 原始檔名），用於冪等性檢查與去重。
 * @param {string} catId - 分類 ID。
 * @param {string} title - 照片原始檔名（不含副檔名）。
 * @returns {string} 唯一複合鍵。
 */
function getPhotoUniqueKey(catId, title) {
  return `${catId}::${title}`;
}

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

/**
 * 執行批次底片掃描、冪等去重、WebP 轉檔與中繼資料索引生成。
 * @returns {Promise<void>}
 */
async function run() {
  console.log(`Scanning source directory: ${SOURCE_DIR}`);
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory does not exist: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
  const categoryMap = new Map();
  const uniqueExistingMap = new Map();
  let removedDuplicatesCount = 0;

  if (fs.existsSync(JSON_DEST)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(JSON_DEST, 'utf8'));
      if (Array.isArray(existingData.categories)) {
        existingData.categories.forEach((c) => {
          if (c.id && c.id !== 'all') {
            categoryMap.set(c.id, c);
          }
        });
      }
      if (Array.isArray(existingData.photos)) {
        for (const p of existingData.photos) {
          const key = getPhotoUniqueKey(p.category, p.title);
          if (!uniqueExistingMap.has(key)) {
            uniqueExistingMap.set(key, p);
          } else {
            // 刪除先前因非冪等合併所產生的重複圖檔
            const dupFilePath = path.join(DEST_DIR, path.basename(p.src));
            if (fs.existsSync(dupFilePath)) {
              fs.unlinkSync(dupFilePath);
            }
            removedDuplicatesCount++;
          }
        }
      }
      console.log(
        `Loaded ${uniqueExistingMap.size} unique existing photos (removed ${removedDuplicatesCount} duplicates).`
      );
    } catch (e) {
      console.warn('Could not read existing photos.json, starting fresh.', e);
    }
  }

  const tasks = [];

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
          const rawBasename = path.parse(file.name).name;
          const key = getPhotoUniqueKey(catId, rawBasename);
          const existingRecord = uniqueExistingMap.get(key);
          const existingDiskPath = existingRecord
            ? path.join(DEST_DIR, path.basename(existingRecord.src))
            : null;

          if (!existingRecord || !fs.existsSync(existingDiskPath)) {
            tasks.push({
              filePath: path.join(fullPath, file.name),
              filename: file.name,
              rawBasename,
              folderName,
              catId,
              key
            });
          }
        }
      }
    } else if (/\.(jpg|jpeg|png|webp|tif|tiff|bmp)$/i.test(entry.name)) {
      const catId = 'uncategorized';
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { id: catId, name: 'Uncategorized' });
      }
      const rawBasename = path.parse(entry.name).name;
      const key = getPhotoUniqueKey(catId, rawBasename);
      if (!uniqueExistingMap.has(key)) {
        tasks.push({
          filePath: fullPath,
          filename: entry.name,
          rawBasename,
          folderName: 'Uncategorized',
          catId,
          key
        });
      }
    }
  }

  console.log(`Found ${tasks.length} new photos requiring conversion across ${categoryMap.size} categories.`);

  const photos = Array.from(uniqueExistingMap.values());
  let maxSortOrder = photos.reduce((max, p) => Math.max(max, p.sortOrder || p.id || 0), 0);
  let completedCount = 0;

  /**
   * 單一照片轉檔工作單元：透過 image.clone() 共享解碼管線以同時產出主圖與 LQIP 縮圖。
   * @param {Object} taskItem - 待處理照片任務項目。
   * @param {number} index - 任務於佇列中之索引。
   * @returns {Promise<void>}
   */
  async function worker(taskItem, index) {
    const sortOrder = maxSortOrder + index + 1;
    const rawBasename = taskItem.rawBasename;
    const cleanFolderName = taskItem.folderName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const destFilename = `${cleanFolderName}_${rawBasename}_${sortOrder}.webp`;
    const destPath = path.join(DEST_DIR, destFilename);

    try {
      const image = sharp(taskItem.filePath);
      const metadata = await image.metadata();
      const width = metadata.width || 1920;
      const height = metadata.height || 1080;
      const aspectRatio = Number((width / height).toFixed(4));

      const mainPipeline = image
        .clone()
        .resize({
          width: width >= height ? (width > 1920 ? 1920 : undefined) : undefined,
          height: height > width ? (height > 1920 ? 1920 : undefined) : undefined,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 82 })
        .toFile(destPath);

      const thumbPipeline = image
        .clone()
        .resize(20)
        .webp({ quality: 30 })
        .toBuffer();

      const [, thumbBuffer] = await Promise.all([mainPipeline, thumbPipeline]);
      const thumbBase64 = `data:image/webp;base64,${thumbBuffer.toString('base64')}`;

      photos.push({
        id: sortOrder,
        src: `/images/gallery/${destFilename}`,
        thumb: thumbBase64,
        title: rawBasename,
        category: taskItem.catId,
        categoryName: taskItem.folderName,
        width: width > 1920 ? (width >= height ? 1920 : Math.round(1920 * aspectRatio)) : width,
        height: height > 1920 ? (height > width ? 1920 : Math.round(1920 / aspectRatio)) : height,
        aspectRatio,
        sortOrder
      });

      completedCount++;
      if (completedCount % 100 === 0 || completedCount === tasks.length) {
        console.log(`Progress: [${completedCount}/${tasks.length}] new photos converted...`);
      }
    } catch (err) {
      console.error(`Error processing photo ${taskItem.filePath}:`, err.message);
    }
  }

  for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
    const chunk = tasks.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(chunk.map((item, chunkIdx) => worker(item, i + chunkIdx)));
  }

  // 重新整理與精簡欄位（移除冗餘之 url / placeholder，保留指定之 Hero 照片標記）
  const normalizedPhotos = photos
    .sort((a, b) => (a.sortOrder || a.id) - (b.sortOrder || b.id))
    .map((p, idx) => {
      const order = idx + 1;
      const heroIdx = HERO_IDS.findIndex((hid) => p.src.includes(hid) || p.title === hid);
      const item = {
        id: p.id || order,
        src: p.src,
        thumb: p.thumb || p.placeholder || '',
        title: p.title,
        category: p.category,
        categoryName: p.categoryName,
        width: p.width,
        height: p.height,
        aspectRatio: Number((p.aspectRatio || p.width / p.height || 1.5).toFixed(4)),
        sortOrder: p.sortOrder || order
      };
      if (heroIdx !== -1) {
        item.hero = true;
        item.heroOrder = heroIdx + 1;
      }
      return item;
    });

  const activeCategoryIds = new Set(normalizedPhotos.map((p) => p.category));
  const categoriesList = Array.from(categoryMap.values())
    .filter((c) => c.id !== 'all' && activeCategoryIds.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant-TW', { numeric: true, sensitivity: 'base' }));

  const outputData = {
    categories: categoriesList,
    photos: normalizedPhotos
  };

  console.log(`Writing photos metadata (${normalizedPhotos.length} photos) to ${JSON_DEST}...`);
  fs.writeFileSync(JSON_DEST, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`Optimization complete! Total unique photos: ${normalizedPhotos.length}.`);
}

run().catch((err) => {
  console.error('Fatal error in optimization script:', err);
  process.exit(1);
});
