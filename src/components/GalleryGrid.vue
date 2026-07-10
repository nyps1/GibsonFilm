<template>
  <section class="gallery-grid-section">
    <TransitionGroup
      name="gallery-fade"
      tag="div"
      class="gallery-grid"
      :class="{ 'gallery-grid--transitioning': isTransitioning }"
    >
      <div
        v-for="photo in displayedPhotos"
        :key="photo.id"
        ref="cardRefs"
        class="gallery-grid__item"
        :style="{ '--row-span': getRowSpan(photo.aspectRatio) }"
      >
        <PhotoCard
          :photo="photo"
          :class="{ 'photo-reveal': revealedIds.has(photo.id) }"
          @open-lightbox="handleOpenLightbox"
        />
      </div>
    </TransitionGroup>

    <div
      v-if="displayedPhotos.length === 0"
      class="gallery-grid__empty"
    >
      <p class="gallery-grid__empty-text">No photographs found.</p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import PhotoCard from '@/components/PhotoCard.vue'

const props = defineProps({
  photos: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['open-lightbox'])

const cardRefs = ref([])
const revealedIds = ref(new Set())
const isTransitioning = ref(false)

const displayedPhotos = computed(() => props.photos)

const getRowSpan = (aspectRatio) => {
  if (!aspectRatio || aspectRatio <= 0) return 25
  // 基礎列高 10px，間距修正
  const baseHeight = 10
  const columnWidth = 400
  const imageHeight = columnWidth / aspectRatio
  return Math.max(15, Math.ceil(imageHeight / baseHeight) + 2)
}

const handleOpenLightbox = (photo) => {
  emit('open-lightbox', photo)
}

let observer = null

const initObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const photoId = entry.target.dataset.photoId
          if (photoId) {
            revealedIds.value = new Set([...revealedIds.value, photoId])
          }
          observer.unobserve(entry.target)
        }
      })
    },
    {
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1
    }
  )
}

const observeCards = () => {
  nextTick(() => {
    const items = document.querySelectorAll('.gallery-grid__item')
    items.forEach((item) => {
      const photoCard = item.querySelector('[data-photo-id]')
      if (photoCard && observer) {
        observer.observe(photoCard)
      }
    })
  })
}

watch(
  () => props.photos,
  () => {
    isTransitioning.value = true
    setTimeout(() => {
      isTransitioning.value = false
      observeCards()
    }, 350)
  },
  { deep: true }
)

onMounted(() => {
  initObserver()
  observeCards()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.gallery-grid-section {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-6, 40px);
  box-sizing: border-box;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 10px;
  gap: var(--space-4, 16px);
  transition: opacity var(--transition-normal, 300ms) ease;
}

.gallery-grid--transitioning {
  opacity: 0.4;
  pointer-events: none;
}

.gallery-grid__item {
  grid-row-end: span var(--row-span, 25);
}

.gallery-grid__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.gallery-grid__empty-text {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 1.125rem;
  color: var(--color-text-secondary, #666666);
  margin: 0;
}

/* TransitionGroup 動畫 */
.gallery-fade-enter-active {
  transition:
    opacity var(--transition-normal, 300ms) ease,
    transform var(--transition-normal, 300ms) ease;
}

.gallery-fade-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
  position: absolute;
}

.gallery-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.97);
}

.gallery-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.gallery-fade-move {
  transition: transform var(--transition-slow, 500ms) ease;
}

@media (max-width: 1024px) {
  .gallery-grid-section {
    padding: 0 var(--space-4, 16px);
  }

  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .gallery-grid-section {
    padding: 0 var(--space-3, 12px);
  }

  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
