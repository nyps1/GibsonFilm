<template>
  <article
    class="photo-card"
    :data-photo-id="photo.id"
    :class="{
      'photo-card--loaded': isFullLoaded,
      'photo-card--revealed': isRevealed
    }"
    tabindex="0"
    role="button"
    :aria-label="`View ${photo.title || 'photograph'}`"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div class="photo-card__image-wrapper">
      <!-- Shimmer placeholder -->
      <div
        class="photo-card__shimmer"
        :class="{ 'photo-card__shimmer--hidden': isThumbLoaded || isFullLoaded }"
        aria-hidden="true"
      ></div>

      <!-- Blurred thumbnail -->
      <img
        v-if="photo.thumb"
        :src="photo.thumb"
        :alt="''"
        class="photo-card__thumb"
        :class="{ 'photo-card__thumb--hidden': isFullLoaded }"
        loading="eager"
        aria-hidden="true"
        @load="onThumbLoad"
      />

      <!-- Full resolution image -->
      <img
        :src="photo.src"
        :alt="photo.title || 'Photograph'"
        class="photo-card__full"
        :class="{ 'photo-card__full--visible': isFullLoaded }"
        loading="lazy"
        @load="onFullLoad"
      />

      <!-- Hover overlay -->
      <div class="photo-card__overlay" aria-hidden="true">
        <div class="photo-card__overlay-content">
          <h3 v-if="photo.title" class="photo-card__title">
            {{ photo.title }}
          </h3>
          <div class="photo-card__accent-line"></div>
          <div class="photo-card__meta">
            <span v-if="photo.filmStock" class="photo-card__meta-item">
              {{ photo.filmStock }}
            </span>
            <span v-if="photo.iso" class="photo-card__meta-item">
              ISO {{ photo.iso }}
            </span>
            <span v-if="photo.location" class="photo-card__meta-item">
              {{ photo.location }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  photo: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && typeof value.id !== 'undefined' && value.src
    }
  }
})

const emit = defineEmits(['open-lightbox'])

const isThumbLoaded = ref(false)
const isFullLoaded = ref(false)
const isRevealed = ref(false)

const onThumbLoad = () => {
  isThumbLoaded.value = true
}

const onFullLoad = () => {
  isFullLoaded.value = true
}

const handleClick = () => {
  emit('open-lightbox', props.photo)
}
</script>

<style scoped>
.photo-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-md, 6px);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-subtle, 0 1px 3px rgba(0, 0, 0, 0.06));
  transition:
    transform var(--transition-normal, 300ms) cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow var(--transition-normal, 300ms) ease;
  will-change: transform;
  /* scroll-reveal 初始狀態 */
  opacity: 0;
  transform: translateY(30px);
}

.photo-card.photo-reveal {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity var(--transition-slow, 500ms) cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform var(--transition-slow, 500ms) cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow var(--transition-normal, 300ms) ease;
}

.photo-card:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-medium, 0 4px 12px rgba(0, 0, 0, 0.1));
}

.photo-card:focus-visible {
  outline: 2px solid var(--color-accent, #C4A882);
  outline-offset: 3px;
}

.photo-card__image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-bg-alt, #161521);
}

/* Shimmer 載入動畫 */
.photo-card__shimmer {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: linear-gradient(
    110deg,
    var(--color-border, #2a2b3c) 8%,
    var(--color-bg-alt, #161521) 18%,
    var(--color-border, #2a2b3c) 33%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
}

.photo-card__shimmer--hidden {
  opacity: 0;
  transition: opacity 400ms ease;
  pointer-events: none;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 模糊縮圖 */
.photo-card__thumb {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(20px);
  transform: scale(1.1);
  transition: opacity var(--transition-slow, 500ms) ease;
}

.photo-card__thumb--hidden {
  opacity: 0;
}

/* 完整影像 */
.photo-card__full {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity var(--transition-slow, 500ms) ease;
}

.photo-card__full--visible {
  opacity: 1;
}

/* Hover 資訊覆蓋層 */
.photo-card__overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.72) 0%,
    rgba(0, 0, 0, 0.15) 50%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity var(--transition-normal, 300ms) ease;
  pointer-events: none;
}

.photo-card:hover .photo-card__overlay {
  opacity: 1;
}

.photo-card__overlay-content {
  padding: 20px;
  width: 100%;
  transform: translateY(8px);
  transition: transform var(--transition-normal, 300ms) ease;
}

.photo-card:hover .photo-card__overlay-content {
  transform: translateY(0);
}

.photo-card__title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0 0 8px;
  line-height: 1.3;
}

.photo-card__accent-line {
  width: 32px;
  height: 2px;
  background-color: var(--color-accent, #C4A882);
  margin-bottom: 10px;
  border-radius: 1px;
  transition: width var(--transition-normal, 300ms) ease;
}

.photo-card:hover .photo-card__accent-line {
  width: 48px;
}

.photo-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.photo-card__meta-item {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.03em;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .photo-card__overlay-content {
    padding: 14px;
  }

  .photo-card__title {
    font-size: 1rem;
  }

  .photo-card__meta-item {
    font-size: 0.6875rem;
  }
}
</style>
