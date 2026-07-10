<template>
  <div class="gallery-view">
    <HeroScrollSequence />

    <section class="gallery-view__content">
      <CategoryFilter class="gallery-view__filter" />
      <div class="gallery-view__header">
        <h2 class="gallery-view__heading">
          <span v-if="activeLabel" class="gallery-view__heading-category">{{ activeLabel }}</span>
          <span v-else>Gallery</span>
        </h2>
        <p class="gallery-view__count">
          {{ store.filteredPhotos.length }} photograph{{ store.filteredPhotos.length !== 1 ? 's' : '' }}
        </p>
      </div>

      <GalleryGrid
        :photos="store.filteredPhotos"
        @open-lightbox="handleOpenLightbox"
      />
    </section>
  </div>
</template>

<script setup>
/**
 * GalleryView.vue
 *
 * 主畫廊頁面，同時作為首頁和分類篩選頁面。
 * 透過 route.params.category 決定篩選邏輯。
 * 若路由未帶分類參數，顯示全部照片。
 */
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGalleryStore } from '@/stores/gallery'
import HeroScrollSequence from '@/components/HeroScrollSequence.vue'
import GalleryGrid from '@/components/GalleryGrid.vue'

const route = useRoute()
const store = useGalleryStore()

const activeLabel = computed(() => {
  if (store.activeCategory === 'all') return null
  const cat = store.categories.find((c) => c.id === store.activeCategory)
  return cat ? cat.name : store.activeCategory
})

const handleOpenLightbox = (photo) => {
  const index = store.filteredPhotos.findIndex((p) => p.id === photo.id)
  if (index >= 0) {
    store.openLightbox(index)
  }
}

watch(
  () => route.params.category,
  (category) => {
    if (category) {
      store.setCategory(category)
    } else {
      store.setCategory('all')
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.gallery-view {
  width: 100%;
}

.gallery-view__content {
  padding: var(--space-12, 48px) 0 var(--space-16, 64px);
}

.gallery-view__header {
  max-width: 1400px;
  margin: 0 auto var(--space-10, 40px);
  padding: 0 var(--space-6, 24px);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.gallery-view__heading {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: var(--text-2xl, 1.875rem);
  font-weight: 600;
  color: var(--color-text, #1A1A1A);
  margin: 0;
  line-height: var(--leading-tight, 1.2);
}

.gallery-view__heading-category {
  text-transform: capitalize;
}

.gallery-view__count {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: var(--text-sm, 0.875rem);
  font-weight: 400;
  color: var(--color-text-tertiary, #666666);
  margin: 0;
  letter-spacing: var(--tracking-wide, 0.04em);
}

@media (max-width: 768px) {
  .gallery-view__content {
    padding: var(--space-8, 32px) 0 var(--space-12, 48px);
  }

  .gallery-view__header {
    padding: 0 var(--space-4, 16px);
    margin-bottom: var(--space-6, 24px);
    flex-direction: column;
    gap: var(--space-1, 4px);
  }

  .gallery-view__heading {
    font-size: var(--text-xl, 1.5rem);
  }
}
</style>
