<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="store.lightbox.isOpen"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="`Viewing: ${store.currentPhoto?.title || 'photograph'}`"
        @click.self="store.closeLightbox()"
      >
        <div class="lightbox__backdrop" aria-hidden="true"></div>

        <!-- Close button -->
        <button
          class="lightbox__close"
          aria-label="Close lightbox"
          @click="store.closeLightbox()"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <!-- Navigation: previous -->
        <button
          v-if="hasMultiplePhotos"
          class="lightbox__nav lightbox__nav--prev"
          aria-label="Previous photo"
          @click.stop="prev"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <!-- Navigation: next -->
        <button
          v-if="hasMultiplePhotos"
          class="lightbox__nav lightbox__nav--next"
          aria-label="Next photo"
          @click.stop="next"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>

        <!-- Main content area -->
        <div
          class="lightbox__content"
          @pointerdown="onPointerDown"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <div class="lightbox__image-container">
            <Transition :name="slideDirection" mode="out-in">
              <img
                :key="store.currentPhoto?.id"
                v-if="store.currentPhoto"
                :src="store.currentPhoto.src"
                :alt="store.currentPhoto.title || 'Photograph'"
                class="lightbox__image"
                draggable="false"
              />
            </Transition>
          </div>

          <!-- Info panel -->
          <div v-if="store.currentPhoto" class="lightbox__info">
            <h2 v-if="store.currentPhoto.title" class="lightbox__title">
              {{ store.currentPhoto.title }}
            </h2>
            <p v-if="store.currentPhoto.category" class="lightbox__category">
              {{ getCategoryName(store.currentPhoto.category) }}
            </p>
            <p v-if="store.currentPhoto.annotation" class="lightbox__annotation">
              {{ store.currentPhoto.annotation }}
            </p>
            <div class="lightbox__details">
              <span v-if="store.currentPhoto.filmStock" class="lightbox__detail">
                {{ store.currentPhoto.filmStock }}
              </span>
              <span v-if="store.currentPhoto.iso" class="lightbox__detail">
                ISO {{ store.currentPhoto.iso }}
              </span>
              <span v-if="store.currentPhoto.location" class="lightbox__detail">
                {{ store.currentPhoto.location }}
              </span>
            </div>
          </div>
        </div>

        <!-- Preload adjacent images -->
        <div v-if="store.lightbox.isOpen" class="lightbox__preload" aria-hidden="true">
          <link
            v-if="prevPhotoSrc"
            rel="preload"
            as="image"
            :href="prevPhotoSrc"
          />
          <link
            v-if="nextPhotoSrc"
            rel="preload"
            as="image"
            :href="nextPhotoSrc"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * LightboxViewer.vue
 *
 * 全螢幕圖片檢視器。狀態完全由 Pinia Store (useGalleryStore) 接管。
 * 支援鍵盤左右鍵、Esc 鍵與觸控滑動導覽。
 */
import { ref, computed, watch, onUnmounted } from 'vue'
import { useGalleryStore } from '@/stores/gallery'

const store = useGalleryStore()

const slideDirection = ref('slide-left')

// Swipe 追蹤
const swipeStartX = ref(0)
const swipeStartY = ref(0)
const isSwiping = ref(false)

const hasMultiplePhotos = computed(() => store.filteredPhotos.length > 1)

const prevPhotoSrc = computed(() => {
  if (!hasMultiplePhotos.value) return null
  const total = store.filteredPhotos.length
  const prevIndex = (store.lightbox.currentIndex - 1 + total) % total
  return store.filteredPhotos[prevIndex]?.src
})

const nextPhotoSrc = computed(() => {
  if (!hasMultiplePhotos.value) return null
  const total = store.filteredPhotos.length
  const nextIndex = (store.lightbox.currentIndex + 1) % total
  return store.filteredPhotos[nextIndex]?.src
})

const getCategoryName = (categoryId) => {
  const cat = store.categories.find(c => c.id === categoryId)
  return cat ? cat.name : categoryId
}

const prev = () => {
  slideDirection.value = 'slide-right'
  store.prevPhoto()
}

const next = () => {
  slideDirection.value = 'slide-left'
  store.nextPhoto()
}

// 觸控 Swipe 處理
const SWIPE_THRESHOLD = 50

const onPointerDown = (e) => {
  if (e.pointerType === 'mouse') return
  swipeStartX.value = e.clientX
  swipeStartY.value = e.clientY
  isSwiping.value = true
}

const onPointerUp = (e) => {
  if (!isSwiping.value) return
  isSwiping.value = false

  const deltaX = e.clientX - swipeStartX.value
  const deltaY = e.clientY - swipeStartY.value

  // 確保水平位移大於垂直位移，避免誤判
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
    if (deltaX < 0) {
      next()
    } else {
      prev()
    }
  }
}

// 避免頁面捲動
watch(
  () => store.lightbox.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: var(--z-lightbox, 400);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox__backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.lightbox__close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition:
    background-color var(--transition-normal, 300ms) ease,
    color var(--transition-normal, 300ms) ease;
}

.lightbox__close:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

.lightbox__close:focus-visible {
  outline: 2px solid var(--color-accent, #C4A882);
  outline-offset: 2px;
}

.lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition:
    background-color var(--transition-normal, 300ms) ease,
    transform var(--transition-normal, 300ms) ease;
}

.lightbox__nav:hover {
  background-color: rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
}

.lightbox__nav:focus-visible {
  outline: 2px solid var(--color-accent, #C4A882);
  outline-offset: 2px;
}

.lightbox__nav--prev {
  left: 20px;
}

.lightbox__nav--next {
  right: 20px;
}

.lightbox__content {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90vw;
  max-height: 90vh;
  touch-action: pan-y;
}

.lightbox__image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 75vh;
  overflow: hidden;
}

.lightbox__image {
  display: block;
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  border-radius: var(--radius-sm, 4px);
  user-select: none;
}

.lightbox__info {
  margin-top: 20px;
  text-align: center;
  max-width: 600px;
  padding: 0 16px;
}

.lightbox__title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: 1.375rem;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 4px;
  line-height: 1.3;
}

.lightbox__category {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-accent, #C4A882);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 10px;
}

.lightbox__annotation {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.9375rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin: 0 0 12px;
}

.lightbox__details {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px 16px;
}

.lightbox__detail {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.03em;
}

.lightbox__preload {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Lightbox enter/exit 過場 */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity var(--transition-normal, 300ms) ease;
}

.lightbox-enter-active .lightbox__content,
.lightbox-leave-active .lightbox__content {
  transition:
    opacity var(--transition-normal, 300ms) ease,
    transform var(--transition-normal, 300ms) cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.lightbox-enter-from .lightbox__content {
  transform: scale(0.92);
  opacity: 0;
}

.lightbox-leave-to .lightbox__content {
  transform: scale(0.95);
  opacity: 0;
}

/* 照片切換動畫：左滑 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: opacity 250ms ease, transform 250ms ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 照片切換動畫：右滑 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 250ms ease, transform 250ms ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 768px) {
  .lightbox__nav {
    width: 40px;
    height: 40px;
  }

  .lightbox__nav--prev {
    left: 8px;
  }

  .lightbox__nav--next {
    right: 8px;
  }

  .lightbox__close {
    top: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
  }

  .lightbox__content {
    max-width: 96vw;
  }

  .lightbox__image-container {
    max-height: 65vh;
  }

  .lightbox__image {
    max-height: 65vh;
  }

  .lightbox__title {
    font-size: 1.125rem;
  }

  .lightbox__info {
    margin-top: 14px;
  }
}
</style>
