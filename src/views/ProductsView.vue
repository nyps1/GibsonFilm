<template>
  <div class="products-view">

    <!-- Page Header -->
    <section class="products-header">
      <div class="products-header__inner">
        <span class="products-header__eyebrow">Gibson Film Shop</span>
        <h1 class="products-header__title">Fine Art Prints</h1>
        <p class="products-header__subtitle">
          Select a photograph from the gallery and receive a museum-quality print delivered to your door.
        </p>
      </div>
    </section>

    <!-- How It Works -->
    <section class="products-how">
      <div class="products-how__inner">
        <div class="products-how__step">
          <span class="products-how__number">01</span>
          <h3 class="products-how__step-title">Choose a Photo</h3>
          <p class="products-how__step-desc">Browse the gallery and select any photograph that speaks to you.</p>
        </div>
        <div class="products-how__divider"></div>
        <div class="products-how__step">
          <span class="products-how__number">02</span>
          <h3 class="products-how__step-title">Select Options</h3>
          <p class="products-how__step-desc">Pick your preferred print size and paper finish.</p>
        </div>
        <div class="products-how__divider"></div>
        <div class="products-how__step">
          <span class="products-how__number">03</span>
          <h3 class="products-how__step-title">Place Order</h3>
          <p class="products-how__step-desc">Your print is processed and shipped directly to you.</p>
        </div>
      </div>
    </section>

    <!-- Product Grid -->
    <section class="products-grid-section">
      <div class="products-grid-section__inner">
        <h2 class="products-grid-section__heading">Select a Photograph</h2>

        <!-- Photo Selection Grid -->
        <div class="products-photo-grid" v-if="galleryStore.photos.length > 0">
          <button
            v-for="photo in galleryStore.photos.slice(0, 12)"
            :key="photo.id"
            class="products-photo-card"
            :class="{ 'is-selected': selectedPhoto?.id === photo.id }"
            @click="selectPhoto(photo)"
          >
            <img
              :src="photo.src"
              :alt="photo.title || ''"
              class="products-photo-card__img"
              loading="lazy"
            />
            <div class="products-photo-card__overlay">
              <span class="products-photo-card__select-label">
                {{ selectedPhoto?.id === photo.id ? '✓ Selected' : 'Select' }}
              </span>
            </div>
          </button>
        </div>
        <p v-else class="products-empty">No photographs available.</p>

        <!-- Configuration Panel -->
        <Transition name="slide-up">
          <div v-if="selectedPhoto" class="products-config">
            <div class="products-config__preview">
              <img :src="selectedPhoto.src" :alt="selectedPhoto.title" class="products-config__preview-img" />
            </div>
            <div class="products-config__options">
              <h3 class="products-config__title">Configure Your Print</h3>
              <p class="products-config__photo-name">{{ selectedPhoto.title || 'Untitled' }}</p>

              <!-- Size -->
              <div class="products-config__group">
                <label class="products-config__label">Print Size</label>
                <div class="products-config__pills">
                  <button
                    v-for="size in printSizes"
                    :key="size.id"
                    class="products-config__pill"
                    :class="{ 'is-active': selectedSize === size.id }"
                    @click="selectedSize = size.id"
                  >
                    <span class="products-config__pill-name">{{ size.label }}</span>
                    <span class="products-config__pill-sub">{{ size.cm }}</span>
                  </button>
                </div>
              </div>

              <!-- Finish -->
              <div class="products-config__group">
                <label class="products-config__label">Paper Finish</label>
                <div class="products-config__pills">
                  <button
                    v-for="finish in paperFinishes"
                    :key="finish.id"
                    class="products-config__pill"
                    :class="{ 'is-active': selectedFinish === finish.id }"
                    @click="selectedFinish = finish.id"
                  >
                    {{ finish.label }}
                  </button>
                </div>
              </div>

              <!-- Price -->
              <div class="products-config__price-row">
                <span class="products-config__price-label">Total</span>
                <span class="products-config__price">{{ currentPrice }}</span>
              </div>

              <!-- Order Button -->
              <button class="products-config__order-btn" @click="handleOrder">
                Order Print
              </button>

              <!-- Coming Soon Notice -->
              <p class="products-config__notice">
                &#128274; Online ordering is coming soon. Please DM on
                <a href="https://www.instagram.com/yan_foo0o0o00oto9raph/" target="_blank" rel="noopener noreferrer">Instagram</a>
                to enquire.
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGalleryStore } from '@/stores/gallery'

const galleryStore = useGalleryStore()

const selectedPhoto = ref(null)
const selectedSize = ref('a4')
const selectedFinish = ref('matte')

const printSizes = [
  { id: 'a5', label: 'A5', cm: '14.8 × 21 cm' },
  { id: 'a4', label: 'A4', cm: '21 × 29.7 cm' },
  { id: 'a3', label: 'A3', cm: '29.7 × 42 cm' },
  { id: 'a2', label: 'A2', cm: '42 × 59.4 cm' },
]

const paperFinishes = [
  { id: 'matte', label: 'Matte' },
  { id: 'glossy', label: 'Glossy' },
  { id: 'satin', label: 'Satin' },
]

const priceMatrix = {
  a5: 480,
  a4: 780,
  a3: 1200,
  a2: 1800,
}

const currentPrice = computed(() => {
  const base = priceMatrix[selectedSize.value] ?? 780
  return `NT$ ${base.toLocaleString()}`
})

const selectPhoto = (photo) => {
  selectedPhoto.value = photo
}

const handleOrder = () => {
  // Placeholder: will integrate payment/contact flow later
  window.open('https://www.instagram.com/yan_foo0o0o00oto9raph/', '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.products-view {
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-bg, #0f0e17);
  color: var(--color-headline, #fffffe);
}

/* ---- Page Header ---- */
.products-header {
  padding: 100px 60px 60px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.products-header__inner {
  max-width: 700px;
  margin: 0 auto;
}

.products-header__eyebrow {
  display: block;
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-button, #ff8906);
  margin-bottom: 16px;
}

.products-header__title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 20px;
  line-height: 1.1;
}

.products-header__subtitle {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 1.0625rem;
  color: var(--color-paragraph, #a7a9be);
  line-height: 1.7;
  margin: 0;
}

/* ---- How It Works ---- */
.products-how {
  padding: 60px 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.products-how__inner {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0;
}

.products-how__step {
  flex: 1;
  text-align: center;
  padding: 0 32px;
}

.products-how__divider {
  width: 1px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.products-how__number {
  display: block;
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-button, #ff8906);
  opacity: 0.4;
  margin-bottom: 12px;
}

.products-how__step-title {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-headline, #fffffe);
  margin: 0 0 8px;
}

.products-how__step-desc {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.8125rem;
  color: var(--color-paragraph, #a7a9be);
  margin: 0;
  line-height: 1.6;
}

/* ---- Photo Grid Section ---- */
.products-grid-section {
  padding: 60px 60px 120px;
}

.products-grid-section__inner {
  max-width: 1400px;
  margin: 0 auto;
}

.products-grid-section__heading {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 36px;
  color: var(--color-headline, #fffffe);
}

.products-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 60px;
}

.products-photo-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 3/2;
  border: 2px solid transparent;
  cursor: pointer;
  background: none;
  padding: 0;
  transition: border-color var(--transition-normal, 300ms) ease;
}

.products-photo-card.is-selected {
  border-color: var(--color-button, #ff8906);
}

.products-photo-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal, 300ms) ease;
}

.products-photo-card:hover .products-photo-card__img {
  transform: scale(1.04);
}

.products-photo-card__overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 14, 23, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-normal, 300ms) ease;
}

.products-photo-card:hover .products-photo-card__overlay,
.products-photo-card.is-selected .products-photo-card__overlay {
  background: rgba(15, 14, 23, 0.4);
}

.products-photo-card__select-label {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  opacity: 0;
  transition: opacity var(--transition-normal, 300ms) ease;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,0.6);
}

.products-photo-card:hover .products-photo-card__select-label,
.products-photo-card.is-selected .products-photo-card__select-label {
  opacity: 1;
}

.products-empty {
  color: var(--color-paragraph, #a7a9be);
  font-family: var(--font-sans, 'Inter'), sans-serif;
}

/* ---- Config Panel ---- */
.products-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  padding: 48px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
}

.products-config__preview {
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 3/2;
}

.products-config__preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.products-config__title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
}

.products-config__photo-name {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.875rem;
  color: var(--color-paragraph, #a7a9be);
  margin: 0 0 32px;
}

.products-config__group {
  margin-bottom: 24px;
}

.products-config__label {
  display: block;
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-paragraph, #a7a9be);
  margin-bottom: 12px;
}

.products-config__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.products-config__pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: var(--color-paragraph, #a7a9be);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color var(--transition-normal, 300ms) ease,
    color var(--transition-normal, 300ms) ease,
    background var(--transition-normal, 300ms) ease;
}

.products-config__pill.is-active {
  border-color: var(--color-button, #ff8906);
  color: var(--color-button, #ff8906);
  background: rgba(255, 137, 6, 0.1);
}

.products-config__pill-name {
  font-weight: 600;
}

.products-config__pill-sub {
  font-size: 0.7rem;
  opacity: 0.7;
}

.products-config__price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 24px;
}

.products-config__price-label {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.875rem;
  color: var(--color-paragraph, #a7a9be);
}

.products-config__price {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-headline, #fffffe);
}

.products-config__order-btn {
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  border: none;
  background-color: var(--color-button, #ff8906);
  color: var(--color-button-text, #fffffe);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: filter var(--transition-normal, 300ms) ease;
  margin-bottom: 16px;
}

.products-config__order-btn:hover {
  filter: brightness(1.1);
}

.products-config__notice {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.8rem;
  color: var(--color-paragraph, #a7a9be);
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

.products-config__notice a {
  color: var(--color-button, #ff8906);
  text-decoration: none;
}

.products-config__notice a:hover {
  text-decoration: underline;
}

/* Slide-up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(24px);
}

@media (max-width: 900px) {
  .products-header,
  .products-how,
  .products-grid-section {
    padding-left: 30px;
    padding-right: 30px;
  }

  .products-how__inner {
    flex-direction: column;
    gap: 32px;
  }

  .products-how__divider {
    width: 60px;
    height: 1px;
  }

  .products-config {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 32px 24px;
  }
}

@media (max-width: 480px) {
  .products-header {
    padding-top: 80px;
    padding-left: 20px;
    padding-right: 20px;
  }

  .products-how,
  .products-grid-section {
    padding-left: 20px;
    padding-right: 20px;
  }

  .products-photo-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}
</style>
