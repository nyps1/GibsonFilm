<template>
  <nav class="category-filter" aria-label="Filter by category">
    <ul class="category-filter__list" role="tablist">
      <li class="category-filter__item" role="presentation">
        <button
          class="category-filter__pill"
          :class="{ 'category-filter__pill--active': galleryStore.activeCategory === 'all' }"
          role="tab"
          :aria-selected="galleryStore.activeCategory === 'all'"
          @click="selectCategory('all')"
        >
          All
        </button>
      </li>
      <li
        v-for="category in galleryStore.categories"
        :key="category.id"
        class="category-filter__item"
        role="presentation"
      >
        <button
          class="category-filter__pill"
          :class="{ 'category-filter__pill--active': galleryStore.activeCategory === category.id }"
          role="tab"
          :aria-selected="galleryStore.activeCategory === category.id"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup>
/**
 * CategoryFilter.vue
 *
 * 水平捲動的分類 pill 標籤列。
 * 直接使用 store 的 activeCategory 作為唯一狀態來源，
 * 避免本地 ref 與 store 狀態不同步的問題。
 */
import { useGalleryStore } from '@/stores/gallery'

const galleryStore = useGalleryStore()

const emit = defineEmits(['category-change'])

const selectCategory = (categoryId) => {
  galleryStore.setCategory(categoryId)
  emit('category-change', categoryId)
}
</script>

<style scoped>
.category-filter {
  width: 100%;
}

.category-filter__list {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  overflow-x: auto;

  /* 隱藏捲軸但保留捲動功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.category-filter__list::-webkit-scrollbar {
  display: none;
}

.category-filter__item {
  flex-shrink: 0;
}

.category-filter__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 18px;
  border-radius: 100px;
  border: 1px solid var(--color-border, #E8E8E8);
  background-color: transparent;
  color: var(--color-text-tertiary, #666666);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color var(--transition-normal, 300ms) ease,
    color var(--transition-normal, 300ms) ease,
    border-color var(--transition-normal, 300ms) ease,
    box-shadow var(--transition-normal, 300ms) ease;
  -webkit-tap-highlight-color: transparent;
}

.category-filter__pill:hover {
  border-color: var(--color-accent, #C4A882);
  color: var(--color-text, #1A1A1A);
}

.category-filter__pill:focus-visible {
  outline: 2px solid var(--color-accent, #C4A882);
  outline-offset: 2px;
}

.category-filter__pill--active {
  background-color: var(--color-accent, #C4A882);
  border-color: var(--color-accent, #C4A882);
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(196, 168, 130, 0.3);
}

.category-filter__pill--active:hover {
  background-color: var(--color-accent, #C4A882);
  border-color: var(--color-accent, #C4A882);
  color: #FFFFFF;
  filter: brightness(0.95);
}

@media (max-width: 768px) {
  .category-filter__pill {
    padding: 6px 14px;
    font-size: 0.75rem;
  }
}
</style>
