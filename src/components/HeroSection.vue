<template>
  <section
    ref="heroRef"
    class="hero-section"
    :style="{ '--parallax-offset': `${parallaxOffset}px` }"
  >
    <div class="hero-section__bg" aria-hidden="true">
      <img
        v-if="featuredPhoto"
        :src="featuredPhoto.src"
        :alt="featuredPhoto.title || 'Featured photograph'"
        class="hero-section__image"
        @load="onImageLoad"
      />
      <div class="hero-section__image-placeholder" :class="{ 'is-hidden': imageLoaded }"></div>
    </div>

    <div class="hero-section__overlay" aria-hidden="true"></div>

    <div class="hero-section__content">
      <h1 class="hero-section__title">Personal Photo Hub</h1>
      <p class="hero-section__tagline">Capturing Moments in Film</p>
    </div>

    <div class="hero-section__scroll-indicator" aria-hidden="true">
      <span class="hero-section__chevron"></span>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from '@/stores/gallery'

const galleryStore = useGalleryStore()

const heroRef = ref(null)
const parallaxOffset = ref(0)
const imageLoaded = ref(false)

const featuredPhoto = computed(() => {
  return galleryStore.heroPhoto || null
})

const onImageLoad = () => {
  imageLoaded.value = true
}

let ticking = false

const handleScroll = () => {
  if (ticking) return
  ticking = true

  requestAnimationFrame(() => {
    const scrollY = window.scrollY
    const heroHeight = heroRef.value?.offsetHeight || window.innerHeight
    if (scrollY <= heroHeight) {
      parallaxOffset.value = scrollY * 0.35
    }
    ticking = false
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
}

.hero-section__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  will-change: transform;
  transform: translateY(var(--parallax-offset, 0));
}

.hero-section__image {
  display: block;
  width: 100%;
  height: calc(100% + 140px);
  object-fit: cover;
  object-position: center 40%;
  opacity: 1;
  transition: opacity var(--transition-slow, 500ms) ease;
}

.hero-section__image-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    var(--color-text, #1A1A1A) 0%,
    #2a2a2a 50%,
    var(--color-text, #1A1A1A) 100%
  );
  background-size: 200% 200%;
  animation: shimmer-hero 2s ease-in-out infinite;
  transition: opacity var(--transition-slow, 500ms) ease;
}

.hero-section__image-placeholder.is-hidden {
  opacity: 0;
  pointer-events: none;
}

@keyframes shimmer-hero {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.hero-section__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.65) 0%,
    rgba(0, 0, 0, 0.25) 40%,
    rgba(0, 0, 0, 0.08) 70%,
    transparent 100%
  );
  pointer-events: none;
}

.hero-section__content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 24px;
  max-width: 800px;
}

.hero-section__title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 16px;
  color: #FFFFFF;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

.hero-section__tagline {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 300;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.2);
}

.hero-section__scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  animation: float-indicator 2.4s ease-in-out infinite;
}

.hero-section__chevron {
  display: block;
  width: 28px;
  height: 28px;
  border-right: 1.5px solid rgba(255, 255, 255, 0.7);
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.7);
  transform: rotate(45deg);
}

@keyframes float-indicator {
  0%, 100% {
    opacity: 0.6;
    transform: translateX(-50%) translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) translateY(10px);
  }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 500px;
  }

  .hero-section__scroll-indicator {
    bottom: 24px;
  }

  .hero-section__chevron {
    width: 22px;
    height: 22px;
  }
}
</style>
