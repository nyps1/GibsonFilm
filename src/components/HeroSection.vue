<template>
  <section ref="containerRef" class="scroll-container">
    <div class="sticky-viewport" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
      
      <!-- 導航列：相機切換器 (向下捲動時淡出) -->
      <nav class="camera-selector" :style="{ opacity: navOpacity, pointerEvents: navOpacity > 0 ? 'auto' : 'none' }">
        <ul class="camera-list">
          <li v-for="camera in cameras" :key="camera.id">
            <button
              class="camera-btn"
              :class="{ 'is-active': activeCamera.id === camera.id }"
              @click="selectCamera(camera)"
            >
              {{ camera.name }}
            </button>
          </li>
        </ul>
        <div class="scroll-hint">
          <span class="scroll-hint-text">Scroll Down</span>
          <span class="chevron"></span>
        </div>
      </nav>

      <!-- Stage 4: 觀景窗內的精選照片 (依序浮現) -->
      <div class="curated-photos-layer">
        <div class="photo-wrapper" :style="{ opacity: photo1Opacity, transform: `scale(${1 + (1 - photo1Opacity) * 0.05})` }">
          <img :src="revealPhotos[0]" alt="Curated 1" class="curated-img" />
        </div>
        <div class="photo-wrapper" :style="{ opacity: photo2Opacity, transform: `scale(${1 + (1 - photo2Opacity) * 0.05})` }">
          <img :src="revealPhotos[1]" alt="Curated 2" class="curated-img" />
        </div>
        <div class="photo-wrapper" :style="{ opacity: photo3Opacity, transform: `scale(${1 + (1 - photo3Opacity) * 0.05})` }">
          <img :src="revealPhotos[2]" alt="Curated 3" class="curated-img" />
        </div>
        
        <!-- 當照片全出後，顯示進入畫廊的提示文字 -->
        <div class="release-hint" :style="{ opacity: photo3Opacity }">
          <h2 class="release-title">Personal Photo Hub</h2>
          <p class="release-subtitle">Capturing Moments in Film</p>
        </div>
      </div>

      <!-- Stage 1 & 2: 前景層 相機本體 -->
      <div 
        class="camera-layer" 
        :style="{ 
          opacity: cameraOpacity,
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${cameraScale})`,
          transformOrigin: activeCamera.viewfinderOrigin 
        }"
      >
        <Transition name="fade-fast" mode="out-in">
          <img :key="activeCamera.id" :src="activeCamera.image" :alt="activeCamera.name" class="camera-img" draggable="false" />
        </Transition>
      </div>

      <!-- Stage 3: 快門閃光特效 -->
      <div class="shutter-flash-layer" :style="{ opacity: flashOpacity }"></div>
      
    </div>
  </section>
</template>

<script setup>
/**
 * Cinematic Hero Sequence
 * 
 * 使用 400vh 容器與 sticky viewport 實現滾動動畫：
 * 1. 3D Hover Parallax
 * 2. 鏡頭/觀景窗放大 (Zoom in)
 * 3. 快門閃光 (Shutter Flash)
 * 4. 照片依序浮現 (Sequential Reveal)
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

const containerRef = ref(null)
const scrollProgress = ref(0)
const mouseX = ref(0)
const mouseY = ref(0)

const cameras = [
  {
    id: 'canon-a1',
    name: 'Canon A-1',
    image: '/images/cameras/canon-a1.png',
    // 將鏡頭中心設定為放大基準點
    viewfinderOrigin: '50% 50%' 
  },
  {
    id: 'genba-kantoku',
    name: '現場監督 28WB',
    image: '/images/cameras/genba-kantoku.png',
    viewfinderOrigin: '60% 45%'
  },
  {
    id: 'fuji-s700',
    name: 'Fujifilm S700',
    image: '/images/cameras/fuji-s700.png',
    viewfinderOrigin: '52% 48%'
  }
]

const activeCamera = ref(cameras[0])

const revealPhotos = [
  '/images/gallery/photo-01.png', // Yushan
  '/images/gallery/photo-04.png', // Alishan
  '/images/gallery/photo-06.png'  // Taroko
]

const selectCamera = (camera) => {
  activeCamera.value = camera
}

// === 滾動進度計算 ===
let ticking = false
const handleScroll = () => {
  if (!ticking && containerRef.value) {
    window.requestAnimationFrame(() => {
      const rect = containerRef.value.getBoundingClientRect()
      // rect.top 是距離視窗頂部的高度，起始點為 0，當捲動到最底時為 -(rect.height - window.innerHeight)
      const maxScroll = rect.height - window.innerHeight
      const currentScroll = -rect.top
      
      // 限制 progress 在 0 到 1 之間
      let progress = currentScroll / maxScroll
      progress = Math.max(0, Math.min(1, progress))
      scrollProgress.value = progress
      
      ticking = false
    })
    ticking = true
  }
}

// === 滑鼠 3D 視差運算 ===
const onMouseMove = (e) => {
  // 將滑鼠座標映射為 -1 到 1 的區間
  const x = (e.clientX / window.innerWidth) * 2 - 1
  const y = (e.clientY / window.innerHeight) * 2 - 1
  mouseX.value = x
  mouseY.value = y
}

const onMouseLeave = () => {
  mouseX.value = 0
  mouseY.value = 0
}

// === 動畫數值映射 (Mapping Functions) ===

// 隱藏導航列 (0% ~ 5% 捲動時)
const navOpacity = computed(() => {
  return Math.max(0, 1 - (scrollProgress.value * 20))
})

// 視差旋轉角度：當開始往下捲動放大時，逐漸歸零以確保放大視角平正
const rotationMultiplier = computed(() => {
  if (scrollProgress.value > 0.1) return 0
  return 1 - (scrollProgress.value / 0.1)
})
const rotateX = computed(() => -(mouseY.value * 12) * rotationMultiplier.value)
const rotateY = computed(() => (mouseX.value * 12) * rotationMultiplier.value)

// Stage 2: 相機放大 (0% ~ 60%)
const cameraScale = computed(() => {
  if (scrollProgress.value <= 0) return 1
  if (scrollProgress.value >= 0.6) return 40 // 極大化，足以填滿螢幕
  // 使用指數增長以產生加速度的衝刺感 (Zoom effect)
  const p = scrollProgress.value / 0.6
  return 1 + Math.pow(p, 4) * 39 
})

// Stage 3: 快門閃光 (55% ~ 65%)，在 60% 達到最亮
const flashOpacity = computed(() => {
  const p = scrollProgress.value
  if (p < 0.55 || p > 0.65) return 0
  if (p <= 0.6) {
    return (p - 0.55) / 0.05 // Fade in
  } else {
    return 1 - ((p - 0.6) / 0.05) // Fade out
  }
})

// 快門閃光後，隱藏相機本體
const cameraOpacity = computed(() => {
  return scrollProgress.value >= 0.6 ? 0 : 1
})

// Stage 4: 照片依序浮現 (65% ~ 90%)
const photo1Opacity = computed(() => {
  const p = scrollProgress.value
  if (p < 0.65) return 0
  if (p > 0.73) return 1
  return (p - 0.65) / 0.08
})

const photo2Opacity = computed(() => {
  const p = scrollProgress.value
  if (p < 0.73) return 0
  if (p > 0.81) return 1
  return (p - 0.73) / 0.08
})

const photo3Opacity = computed(() => {
  const p = scrollProgress.value
  if (p < 0.81) return 0
  if (p > 0.89) return 1
  return (p - 0.81) / 0.08
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  // 初始化計算一次
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.scroll-container {
  /* 提供足夠的滾動空間 (400vh) */
  height: 400vh;
  position: relative;
  background-color: var(--color-bg, #FAFAFA);
}

.sticky-viewport {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg, #FAFAFA);
}

/* --- 導航列 --- */
.camera-selector {
  position: absolute;
  top: max(40px, 8vh);
  left: 0;
  width: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8, 32px);
  will-change: opacity;
}

.camera-list {
  display: flex;
  align-items: center;
  gap: var(--space-8, 32px);
  list-style: none;
  margin: 0;
  padding: 0;
}

.camera-btn {
  background: transparent;
  border: none;
  padding: 8px 0;
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  color: var(--color-text-tertiary, #666666);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  position: relative;
  transition: color var(--transition-normal, 300ms) ease;
}

.camera-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background-color: var(--color-accent, #C4A882);
  transform: translateX(-50%);
  transition: width var(--transition-normal, 300ms) ease;
}

.camera-btn:hover, .camera-btn.is-active {
  color: var(--color-text, #1A1A1A);
}

.camera-btn.is-active::after {
  width: 100%;
}

.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.5;
}

.scroll-hint-text {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.chevron {
  width: 16px;
  height: 16px;
  border-right: 1.5px solid var(--color-text, #1A1A1A);
  border-bottom: 1.5px solid var(--color-text, #1A1A1A);
  transform: rotate(45deg);
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: rotate(45deg) translate(-2px, -2px); }
  50% { transform: rotate(45deg) translate(2px, 2px); }
}

/* --- 前景層：相機本體 --- */
.camera-layer {
  position: absolute;
  z-index: 2;
  width: 100%;
  max-width: 700px;
  aspect-ratio: 4/3;
  will-change: transform, opacity;
  /* 平滑的滑鼠視差跟隨與交叉淡入 */
  transition: opacity 100ms linear;
}

.camera-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15));
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 250ms ease;
  position: absolute;
  top: 0;
  left: 0;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

/* --- 閃光層 --- */
.shutter-flash-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  background-color: #FFFFFF;
  pointer-events: none;
  will-change: opacity;
}

/* --- 背景層：精選照片 --- */
.curated-photos-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(12, 1fr);
  background-color: var(--color-text, #1A1A1A); /* 深色背景襯托照片 */
  overflow: hidden;
}

.photo-wrapper {
  position: absolute;
  will-change: transform, opacity;
  box-shadow: 0 30px 60px rgba(0,0,0,0.4);
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
}

.curated-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 三張照片的位置排版 (不規則散落感) */
.photo-wrapper:nth-child(1) {
  grid-column: 2 / 7;
  grid-row: 2 / 8;
  z-index: 1;
}

.photo-wrapper:nth-child(2) {
  grid-column: 7 / 12;
  grid-row: 3 / 10;
  z-index: 2;
}

.photo-wrapper:nth-child(3) {
  grid-column: 4 / 9;
  grid-row: 6 / 12;
  z-index: 3;
}

/* 進入畫廊的提示文字 */
.release-hint {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  text-align: center;
  color: #FFFFFF;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  will-change: opacity;
}

.release-title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: 2.5rem;
  margin: 0 0 8px;
}

.release-subtitle {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.875rem;
  margin: 0;
}

@media (max-width: 768px) {
  .camera-layer {
    max-width: 90vw;
  }
  .photo-wrapper:nth-child(1) { grid-column: 1 / 11; grid-row: 1 / 6; }
  .photo-wrapper:nth-child(2) { grid-column: 3 / 13; grid-row: 4 / 9; }
  .photo-wrapper:nth-child(3) { grid-column: 2 / 12; grid-row: 7 / 12; }
}
</style>
