<template>
  <section ref="containerRef" class="scroll-container">
    <div class="sticky-viewport">
      
      <!-- Stage 4 & 5: Fullscreen Cinematic Showcase -->
      <div class="curated-photos-layer">
        <!-- 預留註解供日後替換: 以下照片為預定由 nanobanana 生成之滿版高山風景作品 -->
        <img src="/images/gallery/photo-01.png" alt="Curated 1" class="curated-img" :style="{ opacity: photo1Opacity }" />
        <img src="/images/gallery/photo-04.png" alt="Curated 2" class="curated-img" :style="{ opacity: photo2Opacity }" />
        <img src="/images/gallery/photo-06.png" alt="Curated 3" class="curated-img" :style="{ opacity: photo3Opacity }" />
        
        <!-- 當第三張照片顯示後，顯示進入畫廊的提示文字 -->
        <div class="release-hint" :style="{ opacity: photo3Opacity }">
          <h2 class="release-title">Personal Photo Hub</h2>
          <p class="release-subtitle">Capturing Moments in Film</p>
        </div>
      </div>

      <!-- Stage 1 & 2: 前景層 (相機正面與觀景窗背面) -->
      <div class="camera-layer">
        <!-- 觀景窗背面圖 (camera-viewfinder, Stage 2) -->
        <!-- 預留替換: 這裡應放入背面觀景窗的圖片，並適當調整 transformOrigin 以對準觀景窗 -->
        <img 
          src="/images/cameras/canon-a1.png" 
          alt="Camera Viewfinder Placeholder" 
          class="camera-img camera-viewfinder"
          :style="{ opacity: viewfinderOpacity, transform: `scale(${cameraScale})`, transformOrigin: '50% 50%' }"
        />
        
        <!-- 相機正面圖 (camera-front, Stage 1) -->
        <!-- 預留替換: 這裡為使用者將來用 nanobanana 產生的相機正面去背圖 -->
        <img 
          src="/images/cameras/canon-a1.png" 
          alt="Camera Front Placeholder" 
          class="camera-img camera-front"
          :style="{ opacity: frontOpacity }"
        />
      </div>

      <!-- Stage 3: 快門閃光特效 -->
      <div class="shutter-flash-layer" :style="{ opacity: flashOpacity }"></div>
      
    </div>
  </section>
</template>

<script setup>
/**
 * HeroScrollSequence.vue
 * 
 * 800vh 電影級捲動序列：
 * Stage 1 (0-15%): Premium Float - 深灰背景中的 2D 懸浮
 * Stage 2 (15-30%): Match Cut & Zoom - 切換至觀景窗背面並極大化放大
 * Stage 3 (30-35%): The Shutter - 快門閃光
 * Stage 4 (35-85%): Cinematic Showcase - 三張照片依序全螢幕淡入淡出
 * Stage 5 (85-100%): The Release - 釋放鎖定狀態銜接一般內容
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

const containerRef = ref(null)
const scrollProgress = ref(0)
let ticking = false

// === 監聽滾動進度 0.00 ~ 1.00 ===
const handleScroll = () => {
  if (!ticking && containerRef.value) {
    window.requestAnimationFrame(() => {
      const rect = containerRef.value.getBoundingClientRect()
      // maxScroll 為總高度減去一個螢幕高度，確保滑到底時剛好為 1
      const maxScroll = rect.height - window.innerHeight
      const currentScroll = -rect.top
      
      let progress = currentScroll / maxScroll
      progress = Math.max(0, Math.min(1, progress))
      scrollProgress.value = progress
      
      ticking = false
    })
    ticking = true
  }
}

// === Stage 1: 0% - 20% | The Premium Float ===
// (2D 懸浮已改由純 CSS animation 處理，確保不捲動時也能持續呼吸浮動)

const frontOpacity = computed(() => {
  const p = scrollProgress.value
  // Fade out rapidly before 20% to trigger match cut
  if (p < 0.19) return 1
  if (p >= 0.20) return 0
  return 1 - ((p - 0.19) / 0.01)
})

// === Stage 2: 20% - 35% | The Match Cut & Zoom ===
const viewfinderOpacity = computed(() => {
  const p = scrollProgress.value
  // Fade in exactly when front fades out
  if (p < 0.19) return 0
  if (p > 0.35) return 0 // Hide right when shutter triggers
  if (p >= 0.20 && p <= 0.35) return 1
  return (p - 0.19) / 0.01
})

const cameraScale = computed(() => {
  const p = scrollProgress.value
  if (p <= 0.20) return 1
  if (p >= 0.35) return 40 // 極大化放大
  // 從 20% 到 35% 進行指數放大 (加速衝刺感)
  const ratio = Math.max(0, Math.min(1, (p - 0.20) / 0.15))
  return 1 + Math.pow(ratio, 4) * 39
})

// === Stage 3: 35% - 40% | The Shutter ===
const flashOpacity = computed(() => {
  const p = scrollProgress.value
  if (p < 0.35 || p > 0.40) return 0
  if (p <= 0.37) {
    return (p - 0.35) / 0.02 // Rapid fade in
  } else {
    return 1 - ((p - 0.37) / 0.03) // Rapid fade out
  }
})

// === Stage 4: 40% - 85% | Fullscreen Cinematic Showcase ===
// Photo 1: (40% - 55%)
const photo1Opacity = computed(() => {
  const p = scrollProgress.value
  if (p < 0.40 || p > 0.55) return 0
  if (p <= 0.45) return (p - 0.40) / 0.05 // Fade in
  if (p >= 0.50) return 1 - ((p - 0.50) / 0.05) // Fade out
  return 1 // Stay
})

// Photo 2: (56% - 70%)
const photo2Opacity = computed(() => {
  const p = scrollProgress.value
  if (p < 0.56 || p > 0.70) return 0
  if (p <= 0.61) return (p - 0.56) / 0.05 // Fade in
  if (p >= 0.65) return 1 - ((p - 0.65) / 0.05) // Fade out
  return 1 // Stay
})

// Photo 3: (71% - 85%) -> Extended to stay until release
const photo3Opacity = computed(() => {
  const p = scrollProgress.value
  if (p < 0.71) return 0
  if (p <= 0.76) return (p - 0.71) / 0.05 // Fade in
  return 1 // Stay fullscreen
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // 初始化進度
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.scroll-container {
  /* 設定超長滾動軸 */
  height: 800vh;
  position: relative;
  background-color: var(--color-bg); /* 深灰色背景 */
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

/* --- 前景相機層 --- */
.camera-layer {
  position: absolute;
  z-index: 2;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* 增加高品質陰影體現立體感 */
  filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.4));
  will-change: transform, opacity;
}

.camera-front {
  animation: premium-float 6s ease-in-out infinite;
}

@keyframes premium-float {
  0%, 100% { transform: translateY(-8px); }
  50% { transform: translateY(8px); }
}

/* --- 快門閃光 --- */
.shutter-flash-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  background-color: #FFFFFF;
  pointer-events: none;
  will-change: opacity;
}

/* --- 精選滿版照片層 --- */
.curated-photos-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-color: var(--color-bg);
}

.curated-img {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  will-change: opacity;
}

/* --- Release 提示文字 --- */
.release-hint {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  text-shadow: 0 4px 16px rgba(0,0,0,0.8);
  pointer-events: none;
  will-change: opacity;
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
</style>
