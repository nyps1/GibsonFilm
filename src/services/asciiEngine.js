/**
 * ASCII Art 影像特徵擷取與即時全息渲染引擎 (src/services/asciiEngine.js)
 *
 * 職責：
 * 1. 將高解析度相機線稿（Canon A-1 / 現場監督 28WB）透過子像素最大值池化（Max-Pooling）
 *    與 2D Sobel 方向梯度算子轉換為結構化字元網格（Grid Matrix）。
 * 2. 提供支援高 DPI (devicePixelRatio) 之 Canvas 2D 即時渲染器，支援游標徑向光場
 *    （Radial Spotlight）、方向性邊緣字元、語意銘牌嵌入與動態微擾（Micro-jitter）。
 */

const DENSITY_RAMP = ' .:-=+*#%@'
const GLITCH_CHARS = '01/+*#=:~<>'

/**
 * 各相機型號之語意銘牌覆寫定義（以正規化網格比例 xRatio, yRatio 定位）。
 */
const CAMERA_SEMANTIC_LABELS = {
  'canon-a1': [
    { xRatio: 0.37, yRatio: 0.18, text: 'C a n o n', highlight: true },
    { xRatio: 0.09, yRatio: 0.28, text: '[A-1]', highlight: true },
    { xRatio: 0.31, yRatio: 0.48, text: 'CANON LENS FD', highlight: false },
    { xRatio: 0.19, yRatio: 0.72, text: '50mm 1:1.4', highlight: true },
    { xRatio: 0.46, yRatio: 0.77, text: 'MADE IN JAPAN', highlight: false }
  ],
  'genba-kantoku': [
    { xRatio: 0.71, yRatio: 0.26, text: '現場監督', highlight: true },
    { xRatio: 0.73, yRatio: 0.31, text: '28WB', highlight: true },
    { xRatio: 0.38, yRatio: 0.44, text: 'KONICA', highlight: false },
    { xRatio: 0.39, yRatio: 0.64, text: 'GENBA KANTOKU', highlight: false },
    { xRatio: 0.39, yRatio: 0.70, text: '28WB', highlight: true },
    { xRatio: 0.59, yRatio: 0.69, text: '28mm', highlight: false }
  ]
}

/**
 * 載入指定圖片 URL 並回傳 HTMLImageElement 實例。
 * @param {string} src - 圖片路徑。
 * @returns {Promise<HTMLImageElement>} 載入完成的圖片元素。
 */
export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = src
  })
}

/**
 * 從相機線稿影像擷取結構化 ASCII 字元矩陣（採用 4x4 子像素 Max-Pooling 與 Sobel 邊緣方向梯度）。
 * @param {HTMLImageElement} imgElement - 已載入之相機線稿圖片元素。
 * @param {Object} [options={}] - 擷取參數配置。
 * @param {number} [options.cols=108] - 水準字元欄數。
 * @param {number} [options.rows=46] - 垂直字元列數（已補償等寬字型約 1:1.85 長寬比）。
 * @param {string} [options.cameraId='canon-a1'] - 相機識別碼，用於嵌入對應語意銘牌。
 * @returns {Object} 包含 cols, rows, cells 陣列之結構化 ASCII 模型。
 */
export function extractAsciiGridFromImage(imgElement, options = {}) {
  const cols = options.cols || 108
  const rows = options.rows || 46
  const cameraId = options.cameraId || 'canon-a1'

  const subSample = 4
  const sampleW = cols * subSample
  const sampleH = rows * subSample

  const offCanvas = document.createElement('canvas')
  offCanvas.width = sampleW
  offCanvas.height = sampleH
  const ctx = offCanvas.getContext('2d', { willReadFrequently: true })

  // 維持原始圖片長寬比置中繪製於採樣畫布
  ctx.fillStyle = '#0f0e17'
  ctx.fillRect(0, 0, sampleW, sampleH)

  const imgRatio = (imgElement.naturalWidth || 1600) / (imgElement.naturalHeight || 1200)
  const targetRatio = 4 / 3
  let drawW = sampleW
  let drawH = sampleH
  let offsetX = 0
  let offsetY = 0

  if (imgRatio > targetRatio) {
    drawH = sampleW / imgRatio * (targetRatio / (sampleW / sampleH))
    offsetY = (sampleH - drawH) / 2
  } else {
    drawW = sampleH * imgRatio / (targetRatio / (sampleW / sampleH))
    offsetX = (sampleW - drawW) / 2
  }

  ctx.drawImage(imgElement, offsetX, offsetY, drawW, drawH)
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data

  /**
   * 讀取採樣畫布指定座標之相對亮度 (0 ~ 255)。
   * @param {number} x - X 座標。
   * @param {number} y - Y 座標。
   * @returns {number} 最大通道亮度值。
   */
  const getPixelLum = (x, y) => {
    const cx = Math.min(sampleW - 1, Math.max(0, x))
    const cy = Math.min(sampleH - 1, Math.max(0, y))
    const idx = (cy * sampleW + cx) * 4
    return Math.max(imgData[idx], imgData[idx + 1], imgData[idx + 2])
  }

  const cells = new Array(rows * cols)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let maxLum = 0
      let sumLum = 0
      let gx = 0
      let gy = 0

      const x0 = c * subSample
      const y0 = r * subSample

      for (let sy = 0; sy < subSample; sy++) {
        for (let sx = 0; sx < subSample; sx++) {
          const px = x0 + sx
          const py = y0 + sy
          const lum = getPixelLum(px, py)
          if (lum > maxLum) maxLum = lum
          sumLum += lum

          // Sobel 近似水平與垂直差分梯度
          gx += getPixelLum(px + 1, py) - getPixelLum(px - 1, py)
          gy += getPixelLum(px, py + 1) - getPixelLum(px, py - 1)
        }
      }

      const avgLum = sumLum / (subSample * subSample)
      // 混合 Max-Pooling 與 Average-Pooling，確保 3px 細白線不會在縮採樣中消失
      const effectiveLum = maxLum * 0.78 + avgLum * 0.22
      const norm = Math.max(0, Math.min(1, (effectiveLum - 32) / (250 - 32)))

      let char = ' '
      if (norm > 0.06) {
        const ax = Math.abs(gx)
        const ay = Math.abs(gy)
        if (norm > 0.62) {
          if (ay > ax * 1.65) {
            char = '='
          } else if (ax > ay * 1.65) {
            char = '|'
          } else if (gx * gy > 0) {
            char = '/'
          } else if (gx * gy < 0) {
            char = '\\'
          } else {
            char = '#'
          }
        } else {
          const rampIdx = Math.min(
            DENSITY_RAMP.length - 1,
            Math.max(1, Math.floor(Math.pow(norm, 0.75) * (DENSITY_RAMP.length - 1)))
          )
          char = DENSITY_RAMP[rampIdx]
        }
      }

      cells[r * cols + c] = {
        c,
        r,
        nx: (c + 0.5) / cols,
        ny: (r + 0.5) / rows,
        char,
        intensity: norm,
        isSemantic: false,
        highlight: false
      }
    }
  }

  // 嵌入相機專屬之語意銘牌字元，提升品牌與型號辨識度
  const labels = CAMERA_SEMANTIC_LABELS[cameraId] || []
  for (const label of labels) {
    const rowIdx = Math.min(rows - 1, Math.max(0, Math.round(label.yRatio * rows)))
    const startCol = Math.min(cols - label.text.length, Math.max(0, Math.round(label.xRatio * cols)))
    for (let i = 0; i < label.text.length; i++) {
      const targetCell = cells[rowIdx * cols + startCol + i]
      if (targetCell) {
        targetCell.char = label.text[i]
        targetCell.intensity = 1.0
        targetCell.isSemantic = true
        targetCell.highlight = Boolean(label.highlight)
      }
    }
  }

  return {
    cols,
    rows,
    cells
  }
}

/**
 * 於 HTML5 Canvas 上即時渲染互動式 ASCII Art 相機矩陣。
 * @param {CanvasRenderingContext2D} ctx - 目標 Canvas 2D 渲染上下文。
 * @param {Object} grid - 由 extractAsciiGridFromImage 產生的字元網格模型。
 * @param {Object} state - 當前互動與渲染狀態。
 * @param {number} state.width - 畫布邏輯寬度 (px)。
 * @param {number} state.height - 畫布邏輯高度 (px)。
 * @param {number} state.mouseX - 正規化滑鼠 X 座標 [-1, 1]。
 * @param {number} state.mouseY - 正規化滑鼠 Y 座標 [-1, 1]。
 * @param {boolean} state.isHovering - 滑鼠是否位於視窗內。
 * @param {string} state.mode - 渲染模式 ('ascii' | 'hybrid')。
 * @param {number} state.timestamp - 動畫時間戳記 (ms)。
 * @returns {void}
 */
export function renderAsciiFrame(ctx, grid, state) {
  if (!ctx || !grid) return

  const { width, height, mouseX, mouseY, isHovering, mode, timestamp } = state
  ctx.clearRect(0, 0, width, height)

  const cellW = width / grid.cols
  const cellH = height / grid.rows
  const fontSize = Math.max(7, Math.min(13, Math.floor(cellH * 0.96)))

  ctx.font = `600 ${fontSize}px "SFMono-Regular", "JetBrains Mono", "Consolas", "Liberation Mono", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 將 [-1, 1] 滑鼠座標轉換為網格正規化座標 [0, 1]
  const cursorNx = (mouseX + 1) * 0.5
  const cursorNy = (mouseY + 1) * 0.5
  const spotlightRadius = mode === 'hybrid' ? 0.34 : 0.28

  const pulse = Math.sin(timestamp * 0.004) * 0.08

  for (let i = 0; i < grid.cells.length; i++) {
    const cell = grid.cells[i]
    if (cell.intensity <= 0.06 && !cell.isSemantic) continue

    const dx = cell.nx - cursorNx
    const dy = (cell.ny - cursorNy) * 0.78 // 修正橢圓距離場
    const dist = Math.sqrt(dx * dx + dy * dy)

    const inSpotlight = isHovering && dist < spotlightRadius
    const spotFactor = inSpotlight ? Math.pow(1 - dist / spotlightRadius, 1.5) : 0

    // 在 hybrid 全息混合模式下，基礎背景具備輕微透明之科技字元網格，滑鼠掃過時高亮度顯影
    let alpha = cell.intensity
    if (mode === 'hybrid') {
      const baseVisibility = cell.isSemantic ? 0.85 : 0.38 + pulse
      alpha = Math.min(1, cell.intensity * baseVisibility + spotFactor * 0.85)
    } else {
      alpha = Math.min(1, cell.intensity * 0.95 + spotFactor * 0.3)
    }

    if (alpha < 0.08) continue

    let drawChar = cell.char
    // 當滑鼠游標掠過非語意邊緣時，加入微幅數位脈衝字元跳動效果
    if (spotFactor > 0.55 && !cell.isSemantic && ((i + Math.floor(timestamp / 90)) % 19 === 0)) {
      const gIdx = (i + Math.floor(timestamp / 60)) % GLITCH_CHARS.length
      drawChar = GLITCH_CHARS[gIdx]
    }

    // 色彩策略：語意重點銘牌或游標聚焦區採用品牌暖橘金 (#ff8906)，其餘採用標題純白 (#fffffe)
    if (cell.highlight || spotFactor > 0.25) {
      const mix = cell.highlight ? 0.92 : Math.min(1, spotFactor * 1.35)
      const r = Math.round(255)
      const g = Math.round(255 - mix * (255 - 137))
      const b = Math.round(254 - mix * (254 - 6))
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`
    } else {
      ctx.fillStyle = `rgba(255, 255, 254, ${alpha.toFixed(2)})`
    }

    const px = (cell.c + 0.5) * cellW
    const py = (cell.r + 0.5) * cellH
    ctx.fillText(drawChar, px, py)
  }
}
