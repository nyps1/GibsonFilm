<template>
  <section ref="containerRef" class="hero-section">
    <div
      class="sticky-viewport"
      :style="viewportStyle"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <!-- === Top Control Bar: Camera Switcher & ASCII Render Mode Switcher === -->
      <nav
        class="camera-switcher"
        :class="{ 'is-visible': animState === 'idle' || animState === 'done' }"
        aria-label="Camera model and visual mode controls"
      >
        <!-- Camera Model Selector (Canon A-1 / 現場監督 28WB) -->
        <div class="camera-switcher__pills" role="tablist" aria-label="Camera models">
          <button
            v-for="cam in cameras"
            :key="cam.id"
            type="button"
            role="tab"
            class="camera-switcher__btn"
            :class="{ 'is-active': activeCameraId === cam.id }"
            :aria-selected="activeCameraId === cam.id"
            @click="selectCamera(cam.id)"
          >
            <span class="camera-switcher__name">{{ cam.name }}</span>
            <span class="camera-switcher__spec">{{ cam.spec }}</span>
          </button>
        </div>

        <!-- Visual Render Mode Selector (Hybrid Hologram / Pure ASCII / Line-Art) -->
        <div class="camera-switcher__modes" role="tablist" aria-label="Visual render modes">
          <button
            v-for="mode in renderModes"
            :key="mode.id"
            type="button"
            role="tab"
            class="camera-mode__btn"
            :class="{ 'is-active': activeRenderMode === mode.id }"
            :aria-selected="activeRenderMode === mode.id"
            @click="selectRenderMode(mode.id)"
          >
            <span class="camera-mode__icon">{{ mode.icon }}</span>
            <span>{{ mode.label }}</span>
          </button>
        </div>
      </nav>

      <!-- === Stage 3: Viewfinder content (wow photos + flash) === -->
      <div
        class="viewfinder-content"
        :class="{
          'is-visible': animState === 'zooming' || animState === 'slideshow' || animState === 'done',
          'is-zoomed': animState === 'zooming' || animState === 'slideshow' || animState === 'done',
          'is-done': animState === 'done'
        }"
      >
        <div class="viewfinder-inner">
          <div class="view-black-bg" :style="{ opacity: wowState >= 0 ? 1 : 0 }"></div>

          <img
            v-for="(src, index) in wowAssets"
            :key="index"
            :src="src"
            alt=""
            class="wow-img"
            :class="{ 'is-visible': wowState >= index * 2 + 1 }"
          />

          <div
            class="white-flash"
            :class="{ 'is-flashing': wowState >= 0 && wowState % 2 === 0 }"
          ></div>
        </div>
      </div>

      <!-- === Stage 2: Camera rear (zoom mask) === -->
      <div
        class="camera-mask-layer"
        :class="{
          'is-visible': animState !== 'idle',
          'is-zoomed': animState === 'zooming' || animState === 'slideshow' || animState === 'done',
          'is-hidden': animState === 'slideshow' || animState === 'done'
        }"
      >
        <img :src="activeCamera.view" alt="" class="camera-img" />
      </div>

      <!-- === Stage 1: Camera front (True 3D Multi-Plane Stereoscopic + ASCII Hologram) === -->
      <div
        class="camera-front-layer"
        :class="{ 'is-hidden': animState !== 'idle' }"
      >
        <Transition name="camera-swap" mode="out-in">
          <div :key="activeCamera.id" class="idle-float">
            <div class="camera-3d-stage" :style="stage3dStyle">
              <!-- Depth Plane -1: Ambient Rim Glow (Z = -60px) -->
              <div class="camera-3d-glow" :style="glowLayerStyle" aria-hidden="true"></div>

              <!-- Depth Plane 0: Primary Camera Chassis Line-Art (#0f0e17 Base, Z = 0px) -->
              <img
                :src="activeCamera.front"
                :alt="activeCamera.name"
                class="camera-img camera-img--base"
                :class="{
                  'is-dimmed-hybrid': activeRenderMode === 'hybrid',
                  'is-ghost-ascii': activeRenderMode === 'ascii'
                }"
                :style="bodyImgStyle"
                draggable="false"
              />

              <!-- Depth Plane +1A: Stereoscopic Floating Wireframe Layer (Line-Art Mode, Z = +46px) -->
              <img
                v-if="activeCamera.lines && activeRenderMode === 'lineart'"
                :src="activeCamera.lines"
                alt=""
                aria-hidden="true"
                class="camera-img camera-img--lines"
                :style="lensImgStyle"
                draggable="false"
              />

              <!-- Depth Plane +1B: Interactive 3D ASCII Matrix Canvas (Hybrid & ASCII Modes, Z = +48px) -->
              <canvas
                v-show="activeRenderMode !== 'lineart'"
                ref="asciiCanvasRef"
                class="camera-ascii-canvas"
                :style="asciiCanvasStyle"
                aria-hidden="true"
              ></canvas>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Skip Intro Button (visible during zooming/slideshow) -->
      <button
        v-if="animState === 'zooming' || animState === 'slideshow'"
        type="button"
        class="skip-intro-btn"
        @click="skipAnimation"
      >
        Skip Intro &#8594;
      </button>

      <!-- Scroll prompt (shown in idle state) -->
      <div class="scroll-prompt" :class="{ 'is-visible': animState === 'idle' }">
        <span class="scroll-prompt__arrow">&#8595;</span>
        <p class="scroll-prompt__text">
          Scroll down to explore · Move cursor for 3D {{ activeRenderMode === 'lineart' ? 'Parallax' : 'ASCII Scan' }}
        </p>
      </div>

      <!-- Done hint (shown after animation completes) -->
      <div class="done-hint" :class="{ 'is-visible': animState === 'done' }">
        <h2 class="done-hint__title">Personal Photo Hub</h2>
        <p class="done-hint__subtitle">Capturing Moments in Film</p>
        <div class="done-hint__scroll-cue">
          <span class="done-hint__arrow">&#8595;</span>
          <p class="done-hint__cue-text">Scroll to discover the gallery</p>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from '@/stores/gallery'
import {
  loadImageElement,
  extractAsciiGridFromImage,
  renderAsciiFrame
} from '@/services/asciiEngine'

// ─── Camera Models Catalog ────────────────────────────────────────────────────
const cameras = [
  {
    id: 'canon-a1',
    name: 'Canon A-1',
    spec: 'FD 50mm f/1.4',
    front: '/images/cameras/canon-a1.webp',
    lines: '/images/cameras/canon-a1_lines.webp',
    view: '/images/cameras/canon-a1_view.webp'
  },
  {
    id: 'genba-kantoku',
    name: '現場監督 28WB',
    spec: 'Konica 28mm Weatherproof',
    front: '/images/cameras/genba-kantoku.webp',
    lines: '/images/cameras/genba-kantoku_lines.webp',
    view: '/images/cameras/genba-kantoku_view.webp'
  }
]

const renderModes = [
  { id: 'hybrid', label: 'Hybrid ASCII', icon: '◈' },
  { id: 'ascii', label: 'Pure ASCII', icon: '#' },
  { id: 'lineart', label: 'Line-Art', icon: '◯' }
]

const activeCameraId = ref('canon-a1')
const activeRenderMode = ref('hybrid')

const activeCamera = computed(() =>
  cameras.find((c) => c.id === activeCameraId.value) || cameras[0]
)

const galleryStore = useGalleryStore()

const wowAssets = computed(() => {
  const heroItems = galleryStore.photos.filter((p) => p.hero === true)
  heroItems.sort((a, b) => (a.heroOrder || 99) - (b.heroOrder || 99))

  if (heroItems.length < 3) {
    const moreItems = galleryStore.photos.filter((p) => !p.hero).slice(0, 3 - heroItems.length)
    heroItems.push(...moreItems)
  }

  const items = heroItems.slice(0, 3)
  return items.length > 0 ? items.map((p) => p.src) : []
})

// ─── State Machine ────────────────────────────────────────────────────────────
// States: 'idle' | 'zooming' | 'slideshow' | 'done'
const SESSION_KEY = 'gibsonfilm_hero_played'
const animState = ref('idle')
const hasPlayed = ref(false)

/**
 * 切換展示之相機型號。若目前已播放完動畫，切換相機時會回到 3D 相機展示狀態以供互動。
 * @param {string} cameraId - 相機型號 ID ('canon-a1' | 'genba-kantoku')。
 * @returns {void}
 */
const selectCamera = (cameraId) => {
  activeCameraId.value = cameraId
  if (animState.value === 'done') {
    animState.value = 'idle'
    hasPlayed.value = false
    wowState.value = -1
    window.scrollTo({ top: 0, behavior: 'smooth' })
    addTriggerListeners()
  }
}

/**
 * 切換首頁相機之視覺渲染模式（Hybrid 全息混合 / Pure ASCII 純文字藍圖 / Line-Art 純工程線稿）。
 * @param {string} modeId - 視覺模式識別碼 ('hybrid' | 'ascii' | 'lineart')。
 * @returns {void}
 */
const selectRenderMode = (modeId) => {
  activeRenderMode.value = modeId
  if (animState.value === 'done') {
    animState.value = 'idle'
    hasPlayed.value = false
    wowState.value = -1
    window.scrollTo({ top: 0, behavior: 'smooth' })
    addTriggerListeners()
  }
}

// ─── ASCII Engine State & Cache ───────────────────────────────────────────────
const asciiCanvasRef = ref(null)
const asciiGridCache = new Map()
const CANVAS_LOGICAL_W = 800
const CANVAS_LOGICAL_H = 600

/**
 * 初始化或調整 ASCII Canvas 的高 DPI 實體像素緩衝區。
 * @returns {CanvasRenderingContext2D|null} 2D 渲染上下文。
 */
const setupAsciiCanvasContext = () => {
  const canvas = asciiCanvasRef.value
  if (!canvas) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const targetW = Math.round(CANVAS_LOGICAL_W * dpr)
  const targetH = Math.round(CANVAS_LOGICAL_H * dpr)

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW
    canvas.height = targetH
  }
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  return ctx
}

/**
 * 載入當前相機線稿並預先計算結構化 ASCII 網格模型（具備快取機制）。
 * @param {Object} cam - 相機設定物件。
 * @returns {Promise<void>}
 */
const ensureAsciiGridLoaded = async (cam) => {
  if (!cam || asciiGridCache.has(cam.id)) return
  try {
    const img = await loadImageElement(cam.front)
    const grid = extractAsciiGridFromImage(img, {
      cols: 108,
      rows: 46,
      cameraId: cam.id
    })
    asciiGridCache.set(cam.id, grid)
  } catch (err) {
    console.warn(`[ASCII Engine] Failed to extract grid for ${cam.id}:`, err)
  }
}

watch(
  activeCamera,
  async (cam) => {
    await ensureAsciiGridLoaded(cam)
    await nextTick()
    setupAsciiCanvasContext()
  },
  { immediate: true }
)

// ─── Viewfinder Layout (dynamic, recalculated on resize) ─────────────────────
const containerRef = ref(null)
const viewfinderX = ref(0)
const viewfinderY = ref(0)
const viewfinderW = ref(0)
const viewfinderH = ref(0)
const targetScale = ref(10)

/**
 * 依據視窗尺寸重新計算觀景窗遮罩中心座標與目標縮放倍率。
 * @returns {void}
 */
const updateLayout = () => {
  const ww = window.innerWidth
  const wh = window.innerHeight

  const MAX_IMG_WIDTH = 800
  const IMG_W = 2390
  const IMG_H = 1792
  const HOLE_CX = 1100
  const HOLE_CY = 500
  const HOLE_W = 234
  const HOLE_H = 171

  const renderedWidth = Math.min(ww, MAX_IMG_WIDTH)
  const renderedHeight = renderedWidth * (IMG_H / IMG_W)

  const imageLeft = (ww - renderedWidth) / 2
  const imageTop = (wh - renderedHeight) / 2

  const holeX = imageLeft + renderedWidth * (HOLE_CX / IMG_W)
  const holeY = imageTop + renderedHeight * (HOLE_CY / IMG_H)
  const holeWidth = renderedWidth * (HOLE_W / IMG_W)
  const holeHeight = renderedHeight * (HOLE_H / IMG_H)

  const scaleW = (ww * 0.85) / holeWidth
  const scaleH = (wh * 0.80) / holeHeight
  const scale = Math.max(1, Math.min(scaleW, scaleH))

  targetScale.value = scale
  viewfinderX.value = holeX
  viewfinderY.value = holeY
  viewfinderW.value = holeWidth
  viewfinderH.value = holeHeight
}

// ─── Viewport inline styles (CSS custom properties) ──────────────────────────
const viewportStyle = computed(() => ({
  '--viewfinder-x':     `${viewfinderX.value}px`,
  '--viewfinder-y':     `${viewfinderY.value}px`,
  '--viewfinder-width': `${viewfinderW.value * targetScale.value}px`,
  '--viewfinder-height':`${viewfinderH.value * targetScale.value}px`,
  '--target-scale':     targetScale.value,
  '--inv-scale':        1 / targetScale.value,
}))

// ─── 3D Physics Damped Mouse Parallax & Real-Time ASCII Render Loop ───────────
const targetMouseX = ref(0)
const targetMouseY = ref(0)
const smoothMouseX = ref(0)
const smoothMouseY = ref(0)
const isCursorHovering = ref(false)
let rafId = null

/**
 * 執行線性插值 (Lerp) 阻尼運算與 60fps ASCII 全息畫布重繪。
 * @param {number} [timestamp=0] - requestAnimationFrame 時間戳記。
 * @returns {void}
 */
const updateParallaxLoop = (timestamp = 0) => {
  const damping = 0.1
  smoothMouseX.value += (targetMouseX.value - smoothMouseX.value) * damping
  smoothMouseY.value += (targetMouseY.value - smoothMouseY.value) * damping

  if (animState.value === 'idle' && activeRenderMode.value !== 'lineart') {
    const grid = asciiGridCache.get(activeCameraId.value)
    const ctx = setupAsciiCanvasContext()
    if (ctx && grid) {
      renderAsciiFrame(ctx, grid, {
        width: CANVAS_LOGICAL_W,
        height: CANVAS_LOGICAL_H,
        mouseX: smoothMouseX.value,
        mouseY: smoothMouseY.value,
        isHovering: isCursorHovering.value,
        mode: activeRenderMode.value,
        timestamp
      })
    }
  }

  rafId = window.requestAnimationFrame(updateParallaxLoop)
}

/**
 * 處理滑鼠移動事件，將座標正規化至 [-1, 1] 區間並啟動全息掃描光場。
 * @param {MouseEvent} e - 滑鼠事件物件。
 * @returns {void}
 */
const handleMouseMove = (e) => {
  if (animState.value !== 'idle') return
  const { innerWidth, innerHeight } = window
  targetMouseX.value = (e.clientX / innerWidth) * 2 - 1
  targetMouseY.value = (e.clientY / innerHeight) * 2 - 1
  isCursorHovering.value = true
}

/**
 * 當滑鼠離開視窗時，將 3D 視差目標角度平滑歸零。
 * @returns {void}
 */
const handleMouseLeave = () => {
  targetMouseX.value = 0
  targetMouseY.value = 0
  isCursorHovering.value = false
}

const stage3dStyle = computed(() => {
  const rx = (-smoothMouseY.value * 16).toFixed(2)
  const ry = (smoothMouseX.value * 20).toFixed(2)
  return {
    transform: `perspective(950px) rotateX(${rx}deg) rotateY(${ry}deg)`
  }
})

const glowLayerStyle = computed(() => {
  const tx = (-smoothMouseX.value * 30).toFixed(1)
  const ty = (-smoothMouseY.value * 30).toFixed(1)
  return {
    transform: `translate3d(${tx}px, ${ty}px, -60px)`
  }
})

const bodyImgStyle = computed(() => {
  const tx = (smoothMouseX.value * 8).toFixed(1)
  const ty = (smoothMouseY.value * 8).toFixed(1)
  return {
    transform: `translate3d(${tx}px, ${ty}px, 0px)`
  }
})

const lensImgStyle = computed(() => {
  const tx = (smoothMouseX.value * 22).toFixed(1)
  const ty = (smoothMouseY.value * 22).toFixed(1)
  const sx = (-smoothMouseX.value * 12).toFixed(1)
  const sy = (-smoothMouseY.value * 12).toFixed(1)
  return {
    transform: `translate3d(${tx}px, ${ty}px, 46px) scale(1.015)`,
    filter: `drop-shadow(${sx}px ${sy}px 10px rgba(255, 137, 6, 0.38))`
  }
})

const asciiCanvasStyle = computed(() => {
  const isPureAscii = activeRenderMode.value === 'ascii'
  const tx = (smoothMouseX.value * (isPureAscii ? 16 : 24)).toFixed(1)
  const ty = (smoothMouseY.value * (isPureAscii ? 16 : 24)).toFixed(1)
  const z = isPureAscii ? 32 : 48
  const sx = (-smoothMouseX.value * 10).toFixed(1)
  const sy = (-smoothMouseY.value * 10).toFixed(1)
  return {
    transform: `translate3d(${tx}px, ${ty}px, ${z}px)`,
    filter: `drop-shadow(${sx}px ${sy}px 12px rgba(255, 137, 6, 0.42))`
  }
})

// ─── Scroll Lock ──────────────────────────────────────────────────────────────
let lockedScrollY = 0

/**
 * 鎖定頁面滾動以進行觀景窗縮放與幻燈片動畫。
 * @returns {void}
 */
const lockScroll = () => {
  lockedScrollY = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top = `-${lockedScrollY}px`
  document.body.style.width = '100%'
}

/**
 * 解除頁面滾動鎖定並還原捲動位置。
 * @returns {void}
 */
const unlockScroll = () => {
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  window.scrollTo(0, lockedScrollY)
}

// ─── Wow Slideshow ────────────────────────────────────────────────────────────
const wowState = ref(-1)
let slideshowTimeout = null

/**
 * 依序播放觀景窗內的三張精選照片與快門閃光特效。
 * @returns {Promise<void>}
 */
const runSlideshow = async () => {
  const sleep = (ms) => new Promise((resolve) => {
    slideshowTimeout = setTimeout(resolve, ms)
  })

  wowState.value = -1

  for (let i = 0; i < wowAssets.value.length; i++) {
    wowState.value = i * 2           // flash frame
    await sleep(100)                 // 0.1s flash

    wowState.value = i * 2 + 1       // photo visible
    await sleep(1300)
  }
}

// ─── Animation State Machine ──────────────────────────────────────────────────
let animTimeout = null

/**
 * 啟動相機觀景窗縮放與快門幻燈片狀態機。
 * @returns {void}
 */
const startAnimation = () => {
  if (hasPlayed.value || animState.value !== 'idle') return
  hasPlayed.value = true
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // Ignore storage quota errors
  }

  removeTriggerListeners()

  targetMouseX.value = 0
  targetMouseY.value = 0

  lockScroll()
  animState.value = 'zooming'

  animTimeout = setTimeout(async () => {
    animState.value = 'slideshow'
    await runSlideshow()

    animState.value = 'done'
    unlockScroll()
  }, 1800)
}

/**
 * 立即略過開場動畫並釋放頁面捲動鎖定。
 * @returns {void}
 */
const skipAnimation = () => {
  if (animTimeout) clearTimeout(animTimeout)
  if (slideshowTimeout) clearTimeout(slideshowTimeout)
  removeTriggerListeners()
  hasPlayed.value = true
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // Ignore storage errors
  }
  wowState.value = Math.max(0, wowAssets.value.length * 2 - 1)
  animState.value = 'done'
  unlockScroll()
}

// ─── Trigger Detection (wheel + touch) ───────────────────────────────────────
let touchStartY = 0

/**
 * 偵測滑鼠滾輪向下滾動以觸發開場動畫。
 * @param {WheelEvent} e - 滾輪事件。
 * @returns {void}
 */
const onWheelTrigger = (e) => {
  if (e.deltaY > 5) {
    e.preventDefault()
    startAnimation()
  }
}

/**
 * 記錄觸控起始 Y 座標。
 * @param {TouchEvent} e - 觸控事件。
 * @returns {void}
 */
const onTouchStart = (e) => {
  touchStartY = e.touches[0].clientY
}

/**
 * 偵測行動裝置向上滑動手勢以觸發開場動畫。
 * @param {TouchEvent} e - 觸控移動事件。
 * @returns {void}
 */
const onTouchMoveTrigger = (e) => {
  const deltaY = touchStartY - e.touches[0].clientY
  if (deltaY > 10) {
    e.preventDefault()
    startAnimation()
  }
}

/**
 * 註冊滾輪與觸控觸發監聽器。
 * @returns {void}
 */
const addTriggerListeners = () => {
  window.addEventListener('wheel', onWheelTrigger, { passive: false })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMoveTrigger, { passive: false })
}

/**
 * 移除滾輪與觸控觸發監聽器。
 * @returns {void}
 */
const removeTriggerListeners = () => {
  window.removeEventListener('wheel', onWheelTrigger)
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMoveTrigger)
}

// ─── Resize ───────────────────────────────────────────────────────────────────
/**
 * 視窗尺寸變更時更新觀景窗佈局與高 DPI 畫布尺寸。
 * @returns {void}
 */
const handleResize = () => {
  updateLayout()
  setupAsciiCanvasContext()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  window.scrollTo(0, 0)
  updateLayout()

  // 預先載入兩台相機之 ASCII 網格模型
  for (const cam of cameras) {
    ensureAsciiGridLoaded(cam)
  }

  rafId = window.requestAnimationFrame(updateParallaxLoop)

  if (!hasPlayed.value) {
    addTriggerListeners()
  }

  window.addEventListener('resize', handleResize, { passive: true })
})

onUnmounted(() => {
  removeTriggerListeners()
  window.removeEventListener('resize', handleResize)

  if (rafId) window.cancelAnimationFrame(rafId)
  if (animTimeout) clearTimeout(animTimeout)
  if (slideshowTimeout) clearTimeout(slideshowTimeout)

  if (animState.value === 'zooming' || animState.value === 'slideshow') {
    unlockScroll()
  }
})
</script>

<style scoped>
/* ─── Hero Section ─────────────────────────────────────────────────────────── */
.hero-section {
  position: relative;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--color-bg, #0f0e17);
  z-index: 200;
}

.sticky-viewport {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y;
  background-color: var(--color-bg, #0f0e17);
}

/* ─── Camera Switcher & Render Mode Bar ────────────────────────────────────── */
.camera-switcher {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.camera-switcher.is-visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}

.camera-switcher__pills,
.camera-switcher__modes {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px;
  border-radius: 999px;
  background: rgba(22, 21, 33, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
}

.camera-switcher__btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-secondary, #a7a9be);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.25s ease,
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.camera-switcher__btn:hover,
.camera-mode__btn:hover {
  color: var(--color-text, #fffffe);
}

.camera-switcher__btn.is-active {
  background: rgba(255, 137, 6, 0.14);
  border-color: var(--color-accent, #ff8906);
  color: var(--color-text, #fffffe);
  box-shadow: 0 0 20px rgba(255, 137, 6, 0.22);
}

.camera-switcher__name {
  font-weight: 600;
  letter-spacing: 0.03em;
}

.camera-switcher__spec {
  font-size: 0.7rem;
  opacity: 0.65;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.18);
}

.camera-mode__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-secondary, #a7a9be);
  font-family: 'SFMono-Regular', 'Consolas', var(--font-sans, 'Inter'), monospace;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    color 0.25s ease,
    background-color 0.25s ease,
    border-color 0.25s ease;
}

.camera-mode__btn.is-active {
  background: rgba(255, 255, 254, 0.1);
  border-color: rgba(255, 255, 254, 0.35);
  color: var(--color-accent, #ff8906);
}

.camera-mode__icon {
  font-size: 0.8rem;
}

/* ─── Shared layer base styles ─────────────────────────────────────────────── */
.camera-mask-layer,
.camera-front-layer,
.viewfinder-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.camera-front-layer {
  z-index: 3;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.4s ease;
  transform-style: preserve-3d;
}

.camera-front-layer.is-hidden {
  opacity: 0;
  pointer-events: none;
}

/* ─── 3D Stage & Stereoscopic Planes ───────────────────────────────────────── */
.camera-3d-stage {
  position: relative;
  width: 100%;
  max-width: 820px;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  will-change: transform;
}

.camera-3d-glow {
  position: absolute;
  width: 68%;
  height: 62%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 137, 6, 0.16) 0%,
    rgba(229, 49, 112, 0.06) 45%,
    transparent 72%
  );
  filter: blur(36px);
  pointer-events: none;
}

/* ─── Camera Mask Layer (Stage 2) ──────────────────────────────────────────── */
.camera-mask-layer {
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  transform: scale(1);
  transform-origin: var(--viewfinder-x) var(--viewfinder-y);
  transition:
    transform 1.8s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.3s ease;
}

.camera-mask-layer.is-visible {
  opacity: 1;
}

.camera-mask-layer.is-zoomed {
  transform: scale(var(--target-scale));
}

.camera-mask-layer.is-hidden {
  opacity: 0;
  transition: opacity 0s;
}

/* ─── Viewfinder Content (Stage 3) ────────────────────────────────────────── */
.viewfinder-content {
  z-index: 1;
  opacity: 0;
  transform: scale(var(--inv-scale));
  transform-origin: var(--viewfinder-x) var(--viewfinder-y);
  transition:
    transform 1.8s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.6s ease 0.4s;
}

.viewfinder-content.is-visible {
  opacity: 1;
}

.viewfinder-content.is-zoomed {
  transform: scale(1);
}

.viewfinder-content.is-done {
  transform: translate3d(0, -7vh, 0) scale(0.78);
  transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
}

/* ─── Camera images & ASCII Canvas (Seamless #0f0e17 integration) ──────────── */
.camera-img {
  position: absolute;
  width: 100%;
  max-width: 800px;
  height: auto;
  object-fit: contain;
  background-color: transparent !important;
  user-select: none;
  transition: opacity 0.35s ease;
}

.camera-img--base {
  -webkit-mask-image: radial-gradient(ellipse 76% 74% at 50% 50%, #000 72%, transparent 100%);
  mask-image: radial-gradient(ellipse 76% 74% at 50% 50%, #000 72%, transparent 100%);
}

.camera-img--base.is-dimmed-hybrid {
  opacity: 0.72;
}

.camera-img--base.is-ghost-ascii {
  opacity: 0.12;
}

.camera-img--lines {
  mix-blend-mode: screen;
  opacity: 0.92;
  pointer-events: none;
}

.camera-ascii-canvas {
  position: absolute;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 4 / 3;
  height: auto;
  pointer-events: none;
  user-select: none;
}

/* ─── Camera Swap Transition ───────────────────────────────────────────────── */
.camera-swap-enter-active,
.camera-swap-leave-active {
  transition:
    opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.camera-swap-enter-from {
  opacity: 0;
  transform: scale(0.94) translateY(12px);
}

.camera-swap-leave-to {
  opacity: 0;
  transform: scale(1.04) translateY(-12px);
}

/* ─── Idle float animation ─────────────────────────────────────────────────── */
.idle-float {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  animation: float-anim 6s ease-in-out infinite;
}

@keyframes float-anim {
  0%, 100% { transform: translateY(-6px); }
  50%       { transform: translateY(6px); }
}

/* ─── Skip Intro Button ────────────────────────────────────────────────────── */
.skip-intro-btn {
  position: absolute;
  bottom: 32px;
  right: 36px;
  z-index: 25;
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(15, 14, 23, 0.75);
  color: var(--color-text-secondary, #a7a9be);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.skip-intro-btn:hover {
  color: var(--color-text, #fffffe);
  border-color: var(--color-accent, #ff8906);
}

/* ─── Viewfinder Inner (photos + flash) ────────────────────────────────────── */
.viewfinder-inner {
  position: absolute;
  top: var(--viewfinder-y);
  left: var(--viewfinder-x);
  width: var(--viewfinder-width);
  height: var(--viewfinder-height);
  transform: translate(-50%, -50%);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-black-bg {
  position: absolute;
  inset: 0;
  background-color: #0f0e17;
  z-index: 0;
}

.wow-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  z-index: 1;
  contain: paint;
}

.wow-img.is-visible {
  opacity: 1;
}

.white-flash {
  position: absolute;
  inset: 0;
  background-color: #fff;
  opacity: 0;
  z-index: 2;
}

.white-flash.is-flashing {
  opacity: 1;
}

/* ─── Scroll Prompt (idle state) ───────────────────────────────────────────── */
.scroll-prompt {
  position: absolute;
  bottom: 7%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-headline, #fffffe);
  z-index: 10;
  pointer-events: none;
  text-align: center;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.scroll-prompt.is-visible {
  opacity: 1;
}

.scroll-prompt__arrow {
  font-size: 1.5rem;
  color: var(--color-accent, #ff8906);
  animation: bounce 2s ease-in-out infinite;
}

.scroll-prompt__text {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;
  opacity: 0.75;
}

/* ─── Done Hint (after animation) ─────────────────────────────────────────── */
.done-hint {
  position: absolute;
  bottom: 8vh;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1.2s ease 0.4s;
  text-align: center;
  padding: 20px;
}

.done-hint.is-visible {
  opacity: 1;
}

.done-hint__title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: clamp(2.2rem, 6vw, 4rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-headline, #fffffe);
  margin: 0 0 12px;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
}

.done-hint__subtitle {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: clamp(0.8rem, 2vw, 1rem);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-paragraph, #a7a9be);
  margin: 0 0 48px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
}

.done-hint__scroll-cue {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.done-hint__arrow {
  font-size: 1.75rem;
  color: var(--color-button, #ff8906);
  animation: bounce 2s ease-in-out infinite;
}

.done-hint__cue-text {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-paragraph, #a7a9be);
  margin: 0;
}

/* ─── Shared bounce animation ──────────────────────────────────────────────── */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40%  { transform: translateY(-7px); }
  60%  { transform: translateY(-3px); }
}

@media (max-width: 768px) {
  .camera-switcher {
    top: 14px;
    width: 95%;
    gap: 8px;
  }

  .camera-switcher__spec {
    display: none;
  }

  .camera-switcher__btn,
  .camera-mode__btn {
    padding: 6px 12px;
    font-size: 0.72rem;
  }
}
</style>
