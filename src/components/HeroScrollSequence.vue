<template>
  <section ref="containerRef" class="scroll-container">
    <div class="sticky-viewport" :style="{
      '--viewfinder-x': `${viewfinderX}px`,
      '--viewfinder-y': `${viewfinderY}px`,
      '--viewfinder-width': `${viewfinderW * targetScale}px`,
      '--viewfinder-height': `${viewfinderH * targetScale}px`
    }" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
      
      <!-- === Stage 3: 觀景窗內閃光與照片輪播 === -->
      <div 
        class="viewfinder-content"
        :style="{
          opacity: viewOpacity,
          transform: `scale(${cameraScale / targetScale})`,
          transformOrigin: 'var(--viewfinder-x) var(--viewfinder-y)'
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

      <!-- === Stage 2: 相機背面觀景窗 === -->
      <div 
        class="camera-mask-layer"
        :style="{
          transform: `scale(${cameraScale})`,
          transformOrigin: 'var(--viewfinder-x) var(--viewfinder-y)',
          opacity: cameraMaskOpacity
        }"
      >
        <img :src="cameraAssets.view" alt="" class="camera-img" />
      </div>

      <!-- === Stage 1: 正面 3D 滑鼠視差 === -->
      <div class="camera-front-layer" :style="{ opacity: frontOpacity, perspective: '1000px' }">
        <div class="idle-float">
          <img 
            :src="cameraAssets.front" 
            alt="" 
            class="camera-img" 
            :style="{ 
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0px) translate(${bodyX}px, ${bodyY}px)`,
              transition: 'transform 0.15s ease-out'
            }"
          />
        </div>
        <div class="idle-float" v-if="cameraAssets.lens">
          <img 
            :src="cameraAssets.lens" 
            alt="" 
            class="camera-img lens-img" 
            :style="{ 
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(60px) translate(${lenX}px, ${lenY}px)`,
              transition: 'transform 0.15s ease-out'
            }"
          />
        </div>
      </div>
      
      <!-- Scroll Prompt before Zoomin -->
      <div class="scroll-prompt" :style="{ opacity: promptOpacity }">
        <span class="scroll-prompt__arrow">↓</span>
        <p class="scroll-prompt__text">Scroll down to explore</p>
      </div>

      <!-- Release 提示文字 (動畫播完後浮現) -->
      <!-- 動態判斷：當 wowState 大於等於最後一張照片顯示的狀態 (length * 2 - 1) 時浮現 -->
      <div class="release-hint" :style="{ opacity: (wowAssets.length > 0 && wowState >= (wowAssets.length * 2 - 1)) ? 1 : 0 }">
        <h2 class="release-title">Personal Photo Hub</h2>
        <p class="release-subtitle">Capturing Moments in Film</p>
      </div>

    </div>
  </section>
</template>
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from '@/stores/gallery'

const cameraAssets = {
  front: '/images/cameras/canon-a1.jpg', 
  lens: '',
  view: '/images/cameras/canon-a1_view.jpg'
}

const galleryStore = useGalleryStore()

const wowAssets = computed(() => {
  const items = galleryStore.photos.slice(0, 3)
  if (items.length > 0) {
    return items.map(p => p.src)
  }
  return []
})

const MATCH_CUT_START = 0.30
const MATCH_CUT_END = 0.40
const ZOOM_END = 0.70 // 提早結束推進放大，留出一段「已經拉完」的停頓感
const VIEWFINDER_FADE_OUT_START = 0.90

// 這裡刻意使用 Hysteresis (遲滯現象/緩衝區間) 的設計
// 避免使用者在臨界點附近微幅來回滾動時，動畫瘋狂觸發又重置而產生閃爍
const WOW_TRIGGER_THRESHOLD = 0.80 // 必須繼續往下滾動超過 80% 才觸發輪播
const WOW_RESET_THRESHOLD = 0.75   // 必須往上滾動低於 75% 才會重置動畫

const containerRef = ref(null)
const scrollProgress = ref(0)
let ticking = false

// --- 動態計算相機挖空座標與縮放比例 ---
const viewfinderX = ref(0)
const viewfinderY = ref(0)
const viewfinderW = ref(0)
const viewfinderH = ref(0)
const targetScale = ref(8)

const updateLayout = () => {
  const ww = window.innerWidth
  const wh = window.innerHeight
  
  // 基準相機圖片渲染大小
  const MAX_IMG_WIDTH = 800
  const IMG_W = 2390
  const IMG_H = 1792
  
  // 實際偵測 canon-a1_view.jpg 的真實中心點，確保完美置中
  const HOLE_CX = 1100
  const HOLE_CY = 500
  // 刻意縮小開口尺寸定義，迫使 targetScale 衝到 15x~20x，達成超深度的拉近效果
  const HOLE_W = 234
  const HOLE_H = 171
  
  const renderedWidth = Math.min(ww, MAX_IMG_WIDTH)
  const renderedHeight = renderedWidth * (IMG_H / IMG_W)
  
  const imageLeft = (ww - renderedWidth) / 2
  const imageTop = (wh - renderedHeight) / 2
  
  // 計算在螢幕上的絕對像素座標
  const holeX = imageLeft + renderedWidth * (HOLE_CX / IMG_W)
  const holeY = imageTop + renderedHeight * (HOLE_CY / IMG_H)
  const holeWidth = renderedWidth * (HOLE_W / IMG_W)
  const holeHeight = renderedHeight * (HOLE_H / IMG_H)
  
  // 目標是讓照片放大後佔螢幕寬度的 85% 或高度的 80%，取適合的縮放比
  const scaleW = (ww * 0.85) / holeWidth
  const scaleH = (wh * 0.80) / holeHeight
  const scale = Math.max(1, Math.min(scaleW, scaleH))
  
  targetScale.value = scale
  viewfinderX.value = holeX
  viewfinderY.value = holeY
  viewfinderW.value = holeWidth
  viewfinderH.value = holeHeight
}

// --- Mouse Parallax State (Stage 1) ---
const mouseX = ref(0)
const mouseY = ref(0)
const isParallaxLocked = ref(false)

const handleMouseMove = (e) => {
  if (isParallaxLocked.value) return
  const { innerWidth, innerHeight } = window
  mouseX.value = (e.clientX / innerWidth) * 2 - 1
  mouseY.value = (e.clientY / innerHeight) * 2 - 1
}

const handleMouseLeave = () => {
  if (isParallaxLocked.value) return
  mouseX.value = 0
  mouseY.value = 0
}

const bodyX = computed(() => mouseX.value * 8)
const bodyY = computed(() => mouseY.value * 8)
const lenX = computed(() => mouseX.value * 15) // 微調 X 位移
const lenY = computed(() => mouseY.value * 15)

// 加入 3D 旋轉角度，讓相機看起來像是在手中翻轉
const rotateX = computed(() => -mouseY.value * 12)
const rotateY = computed(() => mouseX.value * 12)

const promptOpacity = computed(() => {
  const p = scrollProgress.value
  // 在滾動開始前（p = 0）完全可見，隨著滾動接近匹配點（p = 0.20）淡出至 0
  if (p >= 0.20) return 0
  return 1 - p / 0.20
})

// --- Scroll Logic ---
const handleScroll = () => {
  if (!ticking && containerRef.value) {
    window.requestAnimationFrame(() => {
      const rect = containerRef.value.getBoundingClientRect()
      const maxScroll = rect.height - window.innerHeight
      
      // 防呆機制：若容器高度小於等於視窗高度（例如外部 CSS 覆寫、或特殊螢幕比例）
      // 就直接將進度歸零並返回，避免產生 NaN 導致後續 Computed 全部失效
      if (maxScroll <= 0) {
        scrollProgress.value = 0
        ticking = false
        return
      }

      const currentScroll = -rect.top
      
      let progress = currentScroll / maxScroll
      progress = Math.max(0, Math.min(1, progress))
      scrollProgress.value = progress
      
      if (progress > MATCH_CUT_START && !isParallaxLocked.value) {
        isParallaxLocked.value = true
        mouseX.value = 0
        mouseY.value = 0
      } else if (progress <= MATCH_CUT_START && isParallaxLocked.value) {
        isParallaxLocked.value = false
      }
      
      ticking = false
    })
    ticking = true
  }
}

const handleResize = () => {
  updateLayout()
  handleScroll()
}

// === Stage 1 ➔ 2: The Match Cut ===
const frontOpacity = computed(() => {
  const p = scrollProgress.value
  if (p < MATCH_CUT_START) return 1
  if (p >= MATCH_CUT_END) return 0
  return 1 - ((p - MATCH_CUT_START) / (MATCH_CUT_END - MATCH_CUT_START))
})

// viewOpacity 控制相機「觀景窗內容 (Wow 照片)」的透明度
const viewOpacity = computed(() => {
  const p = scrollProgress.value
  if (p < MATCH_CUT_START) return 0
  if (p > VIEWFINDER_FADE_OUT_START) return 0 // 抵達底部前淡出
  if (p >= MATCH_CUT_END) return 1
  return (p - MATCH_CUT_START) / (MATCH_CUT_END - MATCH_CUT_START)
})

// cameraMaskOpacity 控制相機「機身背面」的透明度
const cameraMaskOpacity = computed(() => {
  const p = scrollProgress.value
  if (p < MATCH_CUT_START) return 0
  // 當正式觸發輪播 (WOW_TRIGGER_THRESHOLD) 時，直接把相機背面圖層隱藏，完全不遮擋接下來的照片
  if (p >= WOW_TRIGGER_THRESHOLD) return 0
  if (p >= MATCH_CUT_END) return 1
  return (p - MATCH_CUT_START) / (MATCH_CUT_END - MATCH_CUT_START)
})

// === Stage 2 ➔ 3: The Zoom In ===
const cameraScale = computed(() => {
  const p = scrollProgress.value
  if (p <= MATCH_CUT_END) return 1
  if (p >= ZOOM_END) return targetScale.value
  
  const ratio = Math.max(0, Math.min(1, (p - MATCH_CUT_END) / (ZOOM_END - MATCH_CUT_END)))
  return 1 + Math.pow(ratio, 2) * (targetScale.value - 1)
})

// --- Stage 3: Auto Flash Slideshow ---
const wowState = ref(-1)
let animationTimeout = null

const startWowAnimation = async () => {
  const sleep = (ms) => new Promise(resolve => { 
    animationTimeout = setTimeout(resolve, ms) 
  })
  
  wowState.value = -1

  // 資料驅動的輪播動畫：支援動態數量增減
  // index * 2 代表閃光階段，index * 2 + 1 代表顯示照片階段
  for (let i = 0; i < wowAssets.value.length; i++) {
    wowState.value = i * 2
    await sleep(100); if(wowState.value === -1) return;
    
    wowState.value = i * 2 + 1
    await sleep(1200); if(wowState.value === -1) return;
  }
}

const resetWowAnimation = () => {
  if (animationTimeout) clearTimeout(animationTimeout)
  wowState.value = -1
}

watch(() => scrollProgress.value, (newVal) => {
  if (newVal >= WOW_TRIGGER_THRESHOLD && wowState.value === -1) {
    startWowAnimation()
  } else if (newVal < WOW_RESET_THRESHOLD && wowState.value !== -1) {
    resetWowAnimation()
  }
})

onMounted(() => {
  // 強制讓使用者每次進入頁面或重新整理時，都回到最頂部，確保一開始安靜地停留在 Canon A1
  window.scrollTo(0, 0)
  
  updateLayout()

  // 加入 passive: true 提升效能
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
  
  // 延遲觸發一次以確保瀏覽器完成滾動重置與渲染
  setTimeout(() => {
    updateLayout()
    handleScroll()
  }, 50)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  if (animationTimeout) clearTimeout(animationTimeout)
})
</script>

<style scoped>
.scroll-container {
  height: 800vh;
  position: relative;
  background-color: var(--color-bg);
  z-index: 200; /* 蓋過頂部的 Header 導覽列，營造沉浸式體驗 */
}

/* 行動裝置版本縮減高度，避免體驗過長 */
@media (max-width: 768px) {
  .scroll-container {
    height: 400vh;
  }
}

.sticky-viewport {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* --- 圖層共用設定 --- */
.camera-mask-layer, .camera-front-layer, .viewfinder-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform, opacity;
}

.camera-front-layer {
  z-index: 3;
  pointer-events: none;
}

.camera-mask-layer {
  z-index: 2;
  pointer-events: none;
}

.viewfinder-content {
  z-index: 1;
}

.camera-img {
  position: absolute;
  width: 100%;
  max-width: 800px;
  height: auto;
  object-fit: contain;
}

.lens-img {
}

.idle-float {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float-anim 6s ease-in-out infinite;
}

@keyframes float-anim {
  0%, 100% { transform: translateY(-6px); }
  50% { transform: translateY(6px); }
}

/* --- 觀景窗內部 (Wow 照與閃光) --- */
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
  background-color: #000000;
  z-index: 0;
  transition: opacity 0.3s ease;
}

.wow-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.1s ease;
  z-index: 1;
}

.wow-img.is-visible {
  opacity: 1;
}

.white-flash {
  position: absolute;
  inset: 0;
  background-color: #FFFFFF;
  opacity: 0;
  z-index: 2;
}

.white-flash.is-flashing {
  opacity: 1;
}

/* --- Release 提示文字 --- */
.release-hint {
  position: absolute;
  bottom: 10%;
  left: 0;
  right: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  text-shadow: 0 4px 16px rgba(0,0,0,0.8);
  pointer-events: none;
  transition: opacity 1s ease;
}

.release-title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}

.release-subtitle {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-size: clamp(0.875rem, 2vw, 1.125rem);
  margin: 0;
}

/* --- Scroll Prompt 提示詞 --- */
.scroll-prompt {
  position: absolute;
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-text, #fffffe);
  z-index: 10;
  pointer-events: none;
  text-align: center;
  transition: opacity 0.2s ease;
}

.scroll-prompt__arrow {
  font-size: 1.5rem;
  animation: bounce 2s infinite;
}

.scroll-prompt__text {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  letter-spacing: var(--tracking-wider, 0.08em);
  text-transform: uppercase;
  margin: 0;
  opacity: 0.8;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
  60% {
    transform: translateY(-3px);
  }
}
</style>
