import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMERAS_DIR = path.resolve(__dirname, '../public/images/cameras');
const BRAIN_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\fd3048d9-1fd9-4b29-a17e-5b573eb04177';

// Portfolio exact background color: #0f0e17 -> RGB(15, 14, 23)
const BG_R = 15;
const BG_G = 14;
const BG_B = 23;

// Portfolio headline white: #fffffe -> RGB(255, 255, 254)
const FG_R = 255;
const FG_G = 255;
const FG_B = 254;

/**
 * 將相機線稿圖片的底色精確轉換為作品集背景色 (#0f0e17)，消除雜訊並輸出最佳化之 WebP 與相容格式。
 * @param {string} inputPath - 原始圖片絕對路徑。
 * @param {string} baseOutputName - 輸出檔名基底（不含副檔名）。
 * @param {Object} [options={}] - 額外處理選項（例如觀景窗透明遮罩區域）。
 * @returns {Promise<void>}
 */
async function processCameraLineArt(inputPath, baseOutputName, options = {}) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const inputBuffer = fs.readFileSync(inputPath);
  const { data, info } = await sharp(inputBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const outBuffer = Buffer.alloc(width * height * 4);
  const linesOnlyBuffer = Buffer.alloc(width * height * 4);

  const lowThreshold = 42;
  const highThreshold = 235;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // 計算線條亮度權重
      const lum = Math.max(r, g, b);
      let t = 0;
      if (lum > lowThreshold) {
        t = Math.min(1, (lum - lowThreshold) / (highThreshold - lowThreshold));
      }

      // 線性插值：底色 100% 對齊 #0f0e17 (15, 14, 23)，線條對齊 #fffffe (255, 255, 254)
      outBuffer[idx] = Math.round(BG_R + t * (FG_R - BG_R));
      outBuffer[idx + 1] = Math.round(BG_G + t * (FG_G - BG_G));
      outBuffer[idx + 2] = Math.round(BG_B + t * (FG_B - BG_B));

      let alpha = 255;
      if (options.cutoutViewfinder) {
        // 觀景窗內部區域正規化座標 (對應 HOLE_CX=1100/2390, HOLE_CY=500/1792, HOLE_W=234/2390, HOLE_H=171/1792)
        const nx = x / width;
        const ny = y / height;
        const cx = 1100 / 2390;
        const cy = 500 / 1792;
        const halfW = (210 / 2390) / 2;
        const halfH = (150 / 1792) / 2;

        if (Math.abs(nx - cx) < halfW && Math.abs(ny - cy) < halfH && t < 0.35) {
          alpha = 0;
        }
      }
      outBuffer[idx + 3] = alpha;

      // 透明背景之純線條圖層（供 3D 雙層視差特效使用）
      linesOnlyBuffer[idx] = FG_R;
      linesOnlyBuffer[idx + 1] = FG_G;
      linesOnlyBuffer[idx + 2] = FG_B;
      linesOnlyBuffer[idx + 3] = Math.round(t * 255);
    }
  }

  const webpPath = path.join(CAMERAS_DIR, `${baseOutputName}.webp`);
  await sharp(outBuffer, { raw: { width, height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(webpPath);

  if (!options.cutoutViewfinder) {
    const linesWebpPath = path.join(CAMERAS_DIR, `${baseOutputName}_lines.webp`);
    await sharp(linesOnlyBuffer, { raw: { width, height, channels: 4 } })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(linesWebpPath);
  }

  if (options.legacyExt) {
    const legacyPath = path.join(CAMERAS_DIR, `${baseOutputName}.${options.legacyExt}`);
    if (options.legacyExt === 'png') {
      await sharp(outBuffer, { raw: { width, height, channels: 4 } })
        .png({ compressionLevel: 9 })
        .toFile(legacyPath);
    } else {
      await sharp(outBuffer, { raw: { width, height, channels: 4 } })
        .flatten({ background: { r: BG_R, g: BG_G, b: BG_B } })
        .jpeg({ quality: 92 })
        .toFile(legacyPath);
    }
  }

  const stat = fs.statSync(webpPath);
  console.log(`Processed ${baseOutputName}.webp (${width}x${height}, ${(stat.size / 1024).toFixed(1)} KB)`);
}

/**
 * 執行所有相機線稿之色彩對齊與 WebP 最佳化流程。
 * @returns {Promise<void>}
 */
async function run() {
  const genbaFrontSrc = path.join(BRAIN_DIR, 'genba_kantoku_lineart_1792200364010.jpg');
  const genbaViewSrc = path.join(BRAIN_DIR, 'genba_kantoku_view_lineart_1792200376751.jpg');

  await processCameraLineArt(
    path.join(CAMERAS_DIR, 'canon-a1.jpg'),
    'canon-a1',
    { legacyExt: 'jpg' }
  );

  await processCameraLineArt(
    path.join(CAMERAS_DIR, 'canon-a1_view.jpg'),
    'canon-a1_view',
    { cutoutViewfinder: true, legacyExt: 'jpg' }
  );

  await processCameraLineArt(
    genbaFrontSrc,
    'genba-kantoku',
    { legacyExt: 'png' }
  );

  await processCameraLineArt(
    genbaViewSrc,
    'genba-kantoku_view',
    { cutoutViewfinder: true, legacyExt: 'jpg' }
  );

  console.log('All camera line-art assets optimized with #0f0e17 background.');
}

run().catch((err) => {
  console.error('Camera optimization failed:', err);
  process.exit(1);
});
