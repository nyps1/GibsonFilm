<template>
  <section ref="containerRef" class="hero-section">
    <div
      class="sticky-viewport"
      :style="viewportStyle"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <!-- === Stage 3: Viewfinder content (wow photos + flash) === -->
      <div
        class="viewfinder-content"
        :class="{
          'is-visible': animState === 'zooming' || animState === 'slideshow' || animState === 'done',
          'is-zoomed': animState === 'slideshow' || animState === 'done',
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
        <img :src="cameraAssets.view" alt="" class="camera-img" />
      </div>

      <!-- === Stage 1: Camera front (3D parallax) === -->
      <div
        class="camera-front-layer"
        :class="{ 'is-hidden': animState !== 'idle' }"
        :style="{ perspective: '1000px' }"
      >
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

      <!-- Scroll prompt (shown in idle state) -->
      <div class="scroll-prompt" :class="{ 'is-visible': animState === 'idle' }">
        <span class="scroll-prompt__arrow">&#8595;</span>
        <p class="scroll-prompt__text">Scroll down to explore</p>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from '@/stores/gallery'

// ─── Assets ───────────────────────────────────────────────────────────────────
const cameraAssets = {
  front: '/images/cameras/canon-a1.jpg',
  lens: '',
  view: '/images/cameras/canon-a1_view.jpg'
}

const galleryStore = useGalleryStore()

const wowAssets = computed(() => {
  const items = galleryStore.photos.slice(0, 3)
  return items.length > 0 ? items.map(p => p.src) : []
})

// ─── State Machine ────────────────────────────────────────────────────────────
// States: 'idle' | 'zooming' | 'slideshow' | 'done'
const animState = ref('idle')
const hasPlayed = ref(false)

// ─── Viewfinder Layout (dynamic, recalculated on resize) ─────────────────────
const containerRef = ref(null)
const viewfinderX = ref(0)
const viewfinderY = ref(0)
const viewfinderW = ref(0)
const viewfinderH = ref(0)
const targetScale = ref(10)

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

// ─── Mouse Parallax (only active in idle state) ───────────────────────────────
const mouseX = ref(0)
const mouseY = ref(0)

const handleMouseMove = (e) => {
  if (animState.value !== 'idle') return
  const { innerWidth, innerHeight } = window
  mouseX.value = (e.clientX / innerWidth) * 2 - 1
  mouseY.value = (e.clientY / innerHeight) * 2 - 1
}

const handleMouseLeave = () => {
  mouseX.value = 0
  mouseY.value = 0
}

const bodyImgStyle = computed(() => ({
  transform: `rotateX(${-mouseY.value * 12}deg) rotateY(${mouseX.value * 12}deg) translate3d(${mouseX.value * 8}px, ${mouseY.value * 8}px, 0)`,
  transition: 'transform 0.15s ease-out'
}))

const lensImgStyle = computed(() => ({
  transform: `rotateX(${-mouseY.value * 12}deg) rotateY(${mouseX.value * 12}deg) translate3d(${mouseX.value * 15}px, ${mouseY.value * 15}px, 60px)`,
  transition: 'transform 0.15s ease-out'
}))

// ─── Scroll Lock ──────────────────────────────────────────────────────────────
let lockedScrollY = 0

const lockScroll = () => {
  lockedScrollY = window.scrollY
  // position: fixed + top trick: most reliable across iOS Safari, Android, desktop
  document.body.style.position = 'fixed'
  document.body.style.top = `-${lockedScrollY}px`
  document.body.style.width = '100%'
}

const unlockScroll = () => {
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  window.scrollTo(0, lockedScrollY)
}

// ─── Wow Slideshow ────────────────────────────────────────────────────────────
const wowState = ref(-1)
let slideshowTimeout = null

const runSlideshow = async () => {
  const sleep = (ms) => new Promise(resolve => {
    slideshowTimeout = setTimeout(resolve, ms)
  })

  wowState.value = -1

  for (let i = 0; i < wowAssets.value.length; i++) {
    wowState.value = i * 2           // flash frame
    await sleep(100)                 // exactly 0.1s flash

    wowState.value = i * 2 + 1      // photo visible
    await sleep(1300)
  }
}

// ─── Animation State Machine ──────────────────────────────────────────────────
let animTimeout = null

const startAnimation = () => {
  // Guard: only play once and only from idle state
  if (hasPlayed.value || animState.value !== 'idle') return
  hasPlayed.value = true

  // Remove trigger listeners immediately so they don't fire again
  removeTriggerListeners()

  // Reset mouse parallax
  mouseX.value = 0
  mouseY.value = 0

  // Lock scroll and begin zoom
  lockScroll()
  animState.value = 'zooming'

  // After CSS transition completes (1.8s), start slideshow
  animTimeout = setTimeout(async () => {
    animState.value = 'slideshow'
    await runSlideshow()

    // Slideshow done → release to user
    animState.value = 'done'
    unlockScroll()
  }, 1800)
}

// ─── Trigger Detection (wheel + touch) ───────────────────────────────────────
let touchStartY = 0

const onWheelTrigger = (e) => {
  if (e.deltaY > 5) {
    e.preventDefault()
    startAnimation()
  }
}

const onTouchStart = (e) => {
  touchStartY = e.touches[0].clientY
}

const onTouchMoveTrigger = (e) => {
  const deltaY = touchStartY - e.touches[0].clientY
  if (deltaY > 10) {
    e.preventDefault()
    startAnimation()
  }
}

const addTriggerListeners = () => {
  window.addEventListener('wheel', onWheelTrigger, { passive: false })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMoveTrigger, { passive: false })
}

const removeTriggerListeners = () => {
  window.removeEventListener('wheel', onWheelTrigger)
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMoveTrigger)
}

// ─── Resize ───────────────────────────────────────────────────────────────────
const handleResize = () => {
  updateLayout()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  // Reset to top to ensure camera is visible on mount
  window.scrollTo(0, 0)

  updateLayout()

  // Add trigger listeners only if animation hasn't played yet
  if (!hasPlayed.value) {
    addTriggerListeners()
  }

  window.addEventListener('resize', handleResize, { passive: true })
})

onUnmounted(() => {
  removeTriggerListeners()
  window.removeEventListener('resize', handleResize)

  // Clean up any pending timeouts
  if (animTimeout) clearTimeout(animTimeout)
  if (slideshowTimeout) clearTimeout(slideshowTimeout)

  // Ensure scroll is unlocked if component is destroyed mid-animation
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
}

.camera-front-layer.is-hidden {
  opacity: 0;
  pointer-events: none;
}

/* ─── Camera Mask Layer (Stage 2) ──────────────────────────────────────────── */
.camera-mask-layer {
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  /* Initial: scale 1, at viewfinder origin */
  transform: scale(1);
  transform-origin: var(--viewfinder-x) var(--viewfinder-y);
  /* CSS transition handles the zoom — Compositor Thread, not JS Main Thread */
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
  transition: opacity 0s; /* Instant disappear at slideshow start to not block the flash */
}

/* ─── Viewfinder Content (Stage 3) ────────────────────────────────────────── */
.viewfinder-content {
  z-index: 1;
  opacity: 0;
  /* Start at inverse scale so the "hole" in the camera mask is exactly filled */
  transform: scale(var(--inv-scale));
  transform-origin: var(--viewfinder-x) var(--viewfinder-y);
  transition:
    transform 1.8s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.6s ease 0.4s; /* fade in slightly delayed */
}

.viewfinder-content.is-visible {
  opacity: 1;
}

.viewfinder-content.is-zoomed {
  transform: scale(1);
}

.viewfinder-content.is-done {
  /* Translate up and scale down to create a gallery frame effect and make room for text below */
  transform: translate3d(0, -7vh, 0) scale(0.78);
  transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
}

/* ─── Camera images ────────────────────────────────────────────────────────── */
.camera-img {
  position: absolute;
  width: 100%;
  max-width: 800px;
  height: auto;
  object-fit: contain;
  transform: translateZ(0);
}

/* ─── Idle float animation ─────────────────────────────────────────────────── */
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
  50%       { transform: translateY(6px); }
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
  background-color: #000;
  z-index: 0;
  /* No transition so it snaps instantly */
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
  /* No transition so it cuts in instantly behind the flash */
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
  /* No transition so it pops on/off instantly */
}

.white-flash.is-flashing {
  opacity: 1;
}

/* ─── Scroll Prompt (idle state) ───────────────────────────────────────────── */
.scroll-prompt {
  position: absolute;
  bottom: 8%;
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
  animation: bounce 2s ease-in-out infinite;
}

.scroll-prompt__text {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;
  opacity: 0.7;
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
  transition: opacity 1.2s ease 0.4s; /* Wait for the photo to shrink and slide up */
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
  text-shadow: 0 4px 24px rgba(0,0,0,0.6);
}

.done-hint__subtitle {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: clamp(0.8rem, 2vw, 1rem);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-paragraph, #a7a9be);
  margin: 0 0 48px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.6);
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
</style>
