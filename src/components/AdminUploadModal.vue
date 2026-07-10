<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="admin-modal" role="dialog" aria-modal="true">
        <div class="admin-modal__backdrop" @click="close"></div>
        
        <div class="admin-modal__content">
          <button class="admin-modal__close" aria-label="Close" @click="close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
          
          <h2 class="admin-modal__title">Admin Upload</h2>
          
          <form class="admin-form" @submit.prevent="handleUpload">
            <div class="admin-form__group">
              <label for="photoFile" class="admin-form__label">Select Photo</label>
              <input type="file" id="photoFile" class="admin-form__input" accept="image/*" required />
            </div>
            
            <div class="admin-form__group">
              <label for="photoTitle" class="admin-form__label">Title</label>
              <input type="text" id="photoTitle" class="admin-form__input" placeholder="e.g. Taipei Sunset" required />
            </div>

            <div class="admin-form__row">
              <div class="admin-form__group">
                <label for="photoCategory" class="admin-form__label">Category</label>
                <select id="photoCategory" class="admin-form__select" required>
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                  <option value="street">Street</option>
                  <option value="travel">Travel</option>
                </select>
              </div>
              <div class="admin-form__group">
                <label for="photoCamera" class="admin-form__label">Camera</label>
                <select id="photoCamera" class="admin-form__select">
                  <option value="canon-a1">Canon A-1</option>
                  <option value="genba-kantoku">現場監督 28WB</option>
                  <option value="fuji-s700">Fujifilm S700</option>
                </select>
              </div>
            </div>

            <button type="submit" class="admin-form__submit" :disabled="isUploading">
              {{ isUploading ? 'Uploading...' : 'Upload Photo' }}
            </button>

            <Transition name="slide-up">
              <p v-if="successMsg" class="admin-form__success">{{ successMsg }}</p>
            </Transition>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const isUploading = ref(false)
const successMsg = ref('')

const close = () => {
  successMsg.value = ''
  emit('close')
}

const handleUpload = () => {
  isUploading.value = true
  successMsg.value = ''
  
  // 模擬上傳延遲
  setTimeout(() => {
    isUploading.value = false
    successMsg.value = 'Photo uploaded successfully! (Mock Action)'
    
    // 自動關閉
    setTimeout(() => {
      close()
    }, 2000)
  }, 1500)
}
</script>

<style scoped>
.admin-modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-lightbox, 1000);
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-modal__backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.admin-modal__content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 500px;
  background-color: var(--color-bg-pure, #FFFFFF);
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-8, 32px);
  box-shadow: var(--shadow-large);
  margin: var(--space-4, 16px);
}

.admin-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary, #666666);
  cursor: pointer;
  padding: 8px;
  transition: color var(--transition-normal, 300ms) ease;
}

.admin-modal__close:hover {
  color: var(--color-text, #1A1A1A);
}

.admin-modal__title {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: var(--text-2xl, 1.875rem);
  font-weight: 600;
  color: var(--color-text, #1A1A1A);
  margin: 0 0 var(--space-6, 24px);
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5, 20px);
}

.admin-form__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-form__row {
  display: flex;
  gap: var(--space-4, 16px);
}

.admin-form__row > .admin-form__group {
  flex: 1;
}

.admin-form__label {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  color: var(--color-text-secondary, #2C2C2C);
}

.admin-form__input,
.admin-form__select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border-strong, #D4D4D4);
  border-radius: var(--radius-sm, 4px);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: var(--text-base, 1rem);
  color: var(--color-text, #1A1A1A);
  background-color: var(--color-bg, #FAFAFA);
  transition: border-color var(--transition-fast, 150ms) ease;
}

.admin-form__input:focus,
.admin-form__select:focus {
  outline: none;
  border-color: var(--color-accent, #C4A882);
}

.admin-form__submit {
  margin-top: var(--space-2, 8px);
  width: 100%;
  padding: 14px;
  background-color: var(--color-text, #1A1A1A);
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-sm, 4px);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: var(--text-base, 1rem);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-normal, 300ms) ease;
}

.admin-form__submit:hover:not(:disabled) {
  background-color: var(--color-text-secondary, #2C2C2C);
}

.admin-form__submit:disabled {
  background-color: var(--color-border-strong, #D4D4D4);
  cursor: not-allowed;
}

.admin-form__success {
  margin: 0;
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: var(--text-sm, 0.875rem);
  color: #2e7d32;
  text-align: center;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal, 300ms) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .admin-modal__content,
.fade-leave-active .admin-modal__content {
  transition: transform var(--transition-normal, 300ms) ease;
}

.fade-enter-from .admin-modal__content {
  transform: translateY(20px) scale(0.95);
}

.fade-leave-to .admin-modal__content {
  transform: translateY(10px) scale(0.98);
}
</style>
