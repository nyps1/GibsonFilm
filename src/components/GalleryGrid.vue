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
        :style="{ 
          flexGrow: photo.aspectRatio, 
          flexBasis: (baseHeight * photo.aspectRatio) + 'px',
          height: baseHeight + 'px'
        }"
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
            revealedIds.value = new Set([...revealedIds.value, Number(photoId)])
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
  updateBaseHeight()
  window.addEventListener('resize', updateBaseHeight)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  window.removeEventListener('resize', updateBaseHeight)
})

const baseHeight = ref(280)
const updateBaseHeight = () => {
  const width = window.innerWidth
  if (width <= 600) {
    baseHeight.value = 150
  } else if (width <= 1024) {
    baseHeight.value = 220
  } else {
    baseHeight.value = 280
  }
}
</script>

<style scoped>
.gallery-grid-section {
  width: 100%;
  max-width: 1600px; /* 稍微放大最大寬度以容納更多照片行 */
  margin: 0 auto;
  padding: 0 var(--space-6, 40px);
  box-sizing: border-box;
}

.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4, 16px);
  transition: opacity var(--transition-normal, 300ms) ease;
}

.gallery-grid::after {
  content: '';
  flex-grow: 99999;
}

.gallery-grid--transitioning {
  opacity: 0.4;
  pointer-events: none;
}

.gallery-grid__item {
  min-width: 120px;
  max-width: 600px;
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
}

@media (max-width: 600px) {
  .gallery-grid-section {
    padding: 0 var(--space-3, 12px);
  }

  .gallery-grid {
    gap: var(--space-2, 8px);
  }
}
</style>
