<template>
  <section ref="containerRef" class="scroll-container">
    <div class="sticky-viewport" :style="{
      '--viewfinder-x': `${viewfinderX}px`,
      '--viewfinder-y': `${viewfinderY}px`,
      '--viewfinder-width': `${viewfinderW * targetScale}px`,
      '--viewfinder-height': `${viewfinderH * targetScale}px`
    }" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
      
      <!-- === Stage 3: Viewfinder flash & photo slideshow === -->
      <div 
        class="viewfinder-content"
        :style="viewfinderStyle"
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

      <!-- === Stage 2: Camera rear viewfinder === -->
      <div 
        class="camera-mask-layer"
        :style="cameraMaskStyle"
      >
        <img :src="cameraAssets.view" alt="" class="camera-img" />
      </div>

      <!-- === Stage 1: Front 3D mouse parallax === -->
      <div class="camera-front-layer" :style="frontLayerStyle">
        <div class="idle-float">
          <img 
            :src="cameraAssets.front" 
            alt="" 
            class="camera-img" 
            :style="bodyImgStyle"
          />
        </div>
        <div class="idle-float" v-if="cameraAssets.lens">
          <img 
            :src="cameraAssets.lens" 
            alt="" 
            class="camera-img lens-img" 
            :style="lensImgStyle"
          />
        </div>
      </div>
      
      <!-- Scroll Prompt before Zoomin -->
      <div class="scroll-prompt" :style="{ opacity: promptOpacity }">
        <span class="scroll-prompt__arrow">&#8595;</span>
        <p class="scroll-prompt__text">Scroll down to explore</p>
      </div>

      <!-- Release hint (appears after slideshow finishes) -->
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
const ZOOM_END = 0.70
const VIEWFINDER_FADE_OUT_START = 0.90

const WOW_TRIGGER_THRESHOLD = 0.80
const WOW_RESET_THRESHOLD = 0.75

const containerRef = ref(null)
const scrollProgress = ref(0)
let rafId = null

// --- Dynamic viewfinder coordinate & scale calculation ---
const viewfinderX = ref(0)
const viewfinderY = ref(0)
const viewfinderW = ref(0)
const viewfinderH = ref(0)
const targetScale = ref(8)

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
const lenX = computed(() => mouseX.value * 15)
const lenY = computed(() => mouseY.value * 15)

const rotateX = computed(() => -mouseY.value * 12)
const rotateY = computed(() => mouseX.value * 12)

const promptOpacity = computed(() => {
  const p = scrollProgress.value
  if (p >= 0.20) return 0
  return 1 - p / 0.20
})

// --- Scroll Logic (optimised: single rAF loop, no getBoundingClientRect inside rAF) ---
let containerTop = 0
let containerHeight = 0

const cacheContainerMetrics = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  containerTop = rect.top + window.scrollY
  containerHeight = rect.height
}

const tick = () => {
  const maxScroll = containerHeight - window.innerHeight
  if (maxScroll <= 0) {
    scrollProgress.value = 0
    rafId = null
    return
  }

  const currentScroll = window.scrollY - containerTop
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

  rafId = null
}

const handleScroll = () => {
  if (rafId === null) {
    rafId = requestAnimationFrame(tick)
  }
}

const handleResize = () => {
  updateLayout()
  cacheContainerMetrics()
  handleScroll()
}

// === Stage 1 -> 2: The Match Cut ===
const frontOpacity = computed(() => {
  const p = scrollProgress.value
  if (p < MATCH_CUT_START) return 1
  if (p >= MATCH_CUT_END) return 0
  return 1 - ((p - MATCH_CUT_START) / (MATCH_CUT_END - MATCH_CUT_START))
})

const viewOpacity = computed(() => {
  const p = scrollProgress.value
  if (p < MATCH_CUT_START) return 0
  if (p > VIEWFINDER_FADE_OUT_START) return 0
  if (p >= MATCH_CUT_END) return 1
  return (p - MATCH_CUT_START) / (MATCH_CUT_END - MATCH_CUT_START)
})

const cameraMaskOpacity = computed(() => {
  const p = scrollProgress.value
  if (p < MATCH_CUT_START) return 0
  if (p >= WOW_TRIGGER_THRESHOLD) return 0
  if (p >= MATCH_CUT_END) return 1
  return (p - MATCH_CUT_START) / (MATCH_CUT_END - MATCH_CUT_START)
})

// === Stage 2 -> 3: The Zoom In ===
// Easing: smoothstep (cubic Hermite) instead of quadratic for smoother perceived acceleration
const cameraScale = computed(() => {
  const p = scrollProgress.value
  if (p <= MATCH_CUT_END) return 1
  if (p >= ZOOM_END) return targetScale.value
  
  let t = Math.max(0, Math.min(1, (p - MATCH_CUT_END) / (ZOOM_END - MATCH_CUT_END)))
  // smoothstep: 3t^2 - 2t^3 — starts and ends gently, peaks in the middle
  t = t * t * (3 - 2 * t)
  return 1 + t * (targetScale.value - 1)
})

// --- Consolidated inline style objects (avoid per-frame object allocation in template) ---
const viewfinderStyle = computed(() => ({
  opacity: viewOpacity.value,
  transform: `scale(${cameraScale.value / targetScale.value})`,
  transformOrigin: `var(--viewfinder-x) var(--viewfinder-y)`
}))

const cameraMaskStyle = computed(() => ({
  transform: `scale(${cameraScale.value})`,
  transformOrigin: `var(--viewfinder-x) var(--viewfinder-y)`,
  opacity: cameraMaskOpacity.value
}))

const frontLayerStyle = computed(() => ({
  opacity: frontOpacity.value,
  perspective: '1000px'
}))

const bodyImgStyle = computed(() => ({
  transform: `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) translate3d(${bodyX.value}px, ${bodyY.value}px, 0)`,
  transition: 'transform 0.15s ease-out'
}))

const lensImgStyle = computed(() => ({
  transform: `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) translate3d(${lenX.value}px, ${lenY.value}px, 60px)`,
  transition: 'transform 0.15s ease-out'
}))

// --- Stage 3: Auto Flash Slideshow ---
const wowState = ref(-1)
let animationTimeout = null

const startWowAnimation = async () => {
  const sleep = (ms) => new Promise(resolve => { 
    animationTimeout = setTimeout(resolve, ms) 
  })
  
  wowState.value = -1

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
  window.scrollTo(0, 0)
  
  updateLayout()
  cacheContainerMetrics()

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
  
  setTimeout(() => {
    updateLayout()
    cacheContainerMetrics()
    handleScroll()
  }, 50)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (animationTimeout) clearTimeout(animationTimeout)
})
</script>

<style scoped>
.scroll-container {
  height: 500vh;
  position: relative;
  background-color: var(--color-bg);
  z-index: 200;
}

/* Tablet breakpoint for smooth transition */
@media (max-width: 1024px) {
  .scroll-container {
    height: 450vh;
  }
}

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
  height: 100dvh; /* Use dynamic viewport height for mobile address bar */
  overflow: hidden;
  background-color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y; /* Tell browser we only need vertical scroll */
}

/* --- Layer shared settings --- */
.camera-mask-layer, .camera-front-layer, .viewfinder-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* GPU-accelerated compositing layer promotion */
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
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
  /* Prevent image rendering from causing jank during transforms */
  image-rendering: auto;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
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

/* --- Viewfinder inner (Wow photos & flash) --- */
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
  /* Prevent compositing overhead until visible */
  contain: paint;
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

/* --- Release hint text --- */
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

/* --- Scroll Prompt --- */
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
