<template>
  <div class="admin-view">
    <div class="admin-view__inner">

      <!-- Header -->
      <div class="admin-header">
        <h1 class="admin-header__title">Admin Upload</h1>
        <p class="admin-header__sub">Batch import and configure photographs for the gallery.</p>
      </div>

      <!-- Step 1: Drop Zone -->
      <section class="admin-section">
        <h2 class="admin-section__title"><span class="admin-step">01</span> Select Photos</h2>

        <div
          class="admin-dropzone"
          :class="{ 'is-dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            class="admin-dropzone__input"
            @change="handleFileChange"
          />
          <div class="admin-dropzone__icon">&#8679;</div>
          <p class="admin-dropzone__label">Drag &amp; drop images here</p>
          <p class="admin-dropzone__sub">or click to browse — supports JPG, PNG, WEBP, HEIC</p>
        </div>
      </section>

      <!-- Step 2: Batch Global Metadata -->
      <section class="admin-section" v-if="queue.length > 0">
        <h2 class="admin-section__title"><span class="admin-step">02</span> Global Settings <span class="admin-badge">applies to all</span></h2>

        <div class="admin-global-row">
          <div class="admin-field">
            <label class="admin-field__label">Category (apply to all)</label>
            <select class="admin-field__select" v-model="globalCategory" @change="applyGlobalCategory">
              <option value="">— keep individual —</option>
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
              <option value="street">Street</option>
              <option value="travel">Travel</option>
              <option value="nature">Nature</option>
              <option value="architecture">Architecture</option>
            </select>
          </div>
          <div class="admin-field">
            <label class="admin-field__label">Camera (apply to all)</label>
            <select class="admin-field__select" v-model="globalCamera" @change="applyGlobalCamera">
              <option value="">— keep individual —</option>
              <option value="canon-a1">Canon A1</option>
              <option value="fuji-s700">Fuji S700</option>
              <option value="genba-kantoku">GENBA KANTOKU</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Step 3: Per-photo Queue Editor -->
      <section class="admin-section" v-if="queue.length > 0">
        <h2 class="admin-section__title">
          <span class="admin-step">03</span>
          Edit Each Photo
          <span class="admin-badge">{{ queue.length }} photo{{ queue.length > 1 ? 's' : '' }}</span>
        </h2>

        <div class="admin-queue">
          <div v-for="(item, index) in queue" :key="item.id" class="admin-queue-item">
            <img :src="item.previewUrl" :alt="item.filename" class="admin-queue-item__thumb" />
            <div class="admin-queue-item__fields">
              <div class="admin-field">
                <label class="admin-field__label">Title</label>
                <input
                  class="admin-field__input"
                  type="text"
                  v-model="item.title"
                  :placeholder="item.filename"
                />
              </div>
              <div class="admin-field-row">
                <div class="admin-field">
                  <label class="admin-field__label">Category</label>
                  <select class="admin-field__select" v-model="item.category">
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                    <option value="street">Street</option>
                    <option value="travel">Travel</option>
                    <option value="nature">Nature</option>
                    <option value="architecture">Architecture</option>
                  </select>
                </div>
                <div class="admin-field">
                  <label class="admin-field__label">Camera</label>
                  <select class="admin-field__select" v-model="item.camera">
                    <option value="canon-a1">Canon A1</option>
                    <option value="fuji-s700">Fuji S700</option>
                    <option value="genba-kantoku">GENBA KANTOKU</option>
                  </select>
                </div>
              </div>
            </div>
            <button class="admin-queue-item__remove" @click="removeFromQueue(index)" aria-label="Remove">
              &#10005;
            </button>
          </div>
        </div>
      </section>

      <!-- Step 4: Generate -->
      <section class="admin-section admin-section--generate" v-if="queue.length > 0">
        <h2 class="admin-section__title"><span class="admin-step">04</span> Generate &amp; Download</h2>
        <p class="admin-generate__note">
          This downloads an updated <code>photos.json</code> that merges your new photos with the existing data.
          Replace <code>public/data/photos.json</code> in the project, then push to GitHub to deploy.
        </p>
        <button class="admin-generate__btn" @click="generateJson">
          &#11123; Download photos.json
        </button>
      </section>

      <!-- Empty State -->
      <div class="admin-empty" v-if="queue.length === 0">
        <p>No photos added yet. Use the drop zone above to get started.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useGalleryStore } from '@/stores/gallery'

const galleryStore = useGalleryStore()

const fileInputRef = ref(null)
const isDragging = ref(false)
const queue = reactive([])

const globalCategory = ref('')
const globalCamera = ref('')

let idCounter = 0

const createQueueItem = (file) => {
  return {
    id: `upload-${++idCounter}`,
    file,
    filename: file.name,
    title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    category: 'landscape',
    camera: 'canon-a1',
    previewUrl: URL.createObjectURL(file),
  }
}

const addFiles = (files) => {
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      queue.push(createQueueItem(file))
    }
  }
}

const handleFileChange = (e) => {
  addFiles(e.target.files)
}

const handleDrop = (e) => {
  isDragging.value = false
  addFiles(e.dataTransfer.files)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const removeFromQueue = (index) => {
  const item = queue[index]
  URL.revokeObjectURL(item.previewUrl)
  queue.splice(index, 1)
}

const applyGlobalCategory = () => {
  if (!globalCategory.value) return
  queue.forEach(item => { item.category = globalCategory.value })
}

const applyGlobalCamera = () => {
  if (!globalCamera.value) return
  queue.forEach(item => { item.camera = globalCamera.value })
}

const generateJson = () => {
  // Build new entries (photo files themselves must still be placed manually)
  const existing = galleryStore.photos.map(p => ({
    id: p.id,
    src: p.src,
    url: p.url || p.src,
    title: p.title || '',
    category: p.category || 'landscape',
    camera: p.camera || '',
    placeholder: p.placeholder || '',
    width: p.width || 4000,
    height: p.height || 3000,
  }))

  const newEntries = queue.map(item => {
    const safeName = item.filename.replace(/\s+/g, '-').toLowerCase()
    const webpName = safeName.replace(/\.[^.]+$/, '.webp')
    const src = `/images/gallery/${webpName}`
    return {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      src,
      url: src,
      title: item.title,
      category: item.category,
      camera: item.camera,
      placeholder: '',
      width: 4000,
      height: 3000,
    }
  })

  const merged = {
    categories: galleryStore.categories.length > 0 ? galleryStore.categories : [
      { id: 'landscape', name: 'Landscape' },
      { id: 'portrait', name: 'Portrait' },
      { id: 'street', name: 'Street' },
      { id: 'travel', name: 'Travel' }
    ],
    photos: [...existing, ...newEntries]
  }

  const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'photos.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.admin-view {
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-bg, #0f0e17);
  color: var(--color-headline, #fffffe);
  padding: 100px 0 80px;
}

.admin-view__inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 40px;
}

/* ---- Header ---- */
.admin-header {
  margin-bottom: 48px;
}

.admin-header__title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 8px;
}

.admin-header__sub {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 1rem;
  color: var(--color-paragraph, #a7a9be);
  margin: 0;
}

/* ---- Section ---- */
.admin-section {
  margin-bottom: 48px;
  padding-bottom: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.admin-section--generate {
  border-bottom: none;
}

.admin-section__title {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-headline, #fffffe);
  margin: 0 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-step {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-button, #ff8906);
  opacity: 0.5;
}

.admin-badge {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-paragraph, #a7a9be);
  background: rgba(255, 255, 255, 0.07);
  padding: 3px 10px;
  border-radius: 100px;
}

/* ---- Drop Zone ---- */
.admin-dropzone {
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 64px 40px;
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--transition-normal, 300ms) ease,
    background var(--transition-normal, 300ms) ease;
}

.admin-dropzone:hover,
.admin-dropzone.is-dragging {
  border-color: var(--color-button, #ff8906);
  background: rgba(255, 137, 6, 0.04);
}

.admin-dropzone__input {
  display: none;
}

.admin-dropzone__icon {
  font-size: 3rem;
  color: var(--color-button, #ff8906);
  margin-bottom: 12px;
  display: block;
}

.admin-dropzone__label {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-headline, #fffffe);
  margin: 0 0 6px;
}

.admin-dropzone__sub {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.8125rem;
  color: var(--color-paragraph, #a7a9be);
  margin: 0;
}

/* ---- Global Row ---- */
.admin-global-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* ---- Fields ---- */
.admin-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.admin-field__label {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-paragraph, #a7a9be);
}

.admin-field__input,
.admin-field__select {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-headline, #fffffe);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.875rem;
  outline: none;
  transition: border-color var(--transition-normal, 300ms) ease;
  box-sizing: border-box;
}

.admin-field__input:focus,
.admin-field__select:focus {
  border-color: var(--color-button, #ff8906);
}

.admin-field__select option {
  background: #1a1930;
  color: #fffffe;
}

/* ---- Queue Items ---- */
.admin-queue {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-queue-item {
  display: grid;
  grid-template-columns: 100px 1fr 40px;
  gap: 20px;
  align-items: start;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.admin-queue-item__thumb {
  width: 100px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
}

.admin-queue-item__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-queue-item__remove {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: var(--color-paragraph, #a7a9be);
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color var(--transition-normal, 300ms) ease,
    border-color var(--transition-normal, 300ms) ease;
  flex-shrink: 0;
}

.admin-queue-item__remove:hover {
  color: var(--color-highlight, #f25f4c);
  border-color: var(--color-highlight, #f25f4c);
}

/* ---- Generate ---- */
.admin-generate__note {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.875rem;
  color: var(--color-paragraph, #a7a9be);
  line-height: 1.7;
  margin: 0 0 24px;
}

.admin-generate__note code {
  font-family: 'SFMono-Regular', 'Consolas', monospace;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8125rem;
  color: var(--color-button, #ff8906);
}

.admin-generate__btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
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
}

.admin-generate__btn:hover {
  filter: brightness(1.1);
}

/* ---- Empty ---- */
.admin-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-paragraph, #a7a9be);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.9375rem;
}

@media (max-width: 768px) {
  .admin-view__inner {
    padding: 0 20px;
  }

  .admin-global-row {
    grid-template-columns: 1fr;
  }

  .admin-queue-item {
    grid-template-columns: 80px 1fr 32px;
    gap: 12px;
    padding: 16px;
  }

  .admin-queue-item__thumb {
    width: 80px;
    height: 56px;
  }

  .admin-field-row {
    grid-template-columns: 1fr;
  }
}
</style>
