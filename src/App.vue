<template>
  <div class="app-shell">
    <AppHeader />

    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="view-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <LightboxViewer />
    <AppFooter />
  </div>
</template>

<script setup>
/**
 * App.vue - 應用程式根元件
 *
 * 職責：
 * 1. 組合全域 Layout 元件（Header / Main / Footer / Lightbox）
 * 2. 觸發初始資料載入（fetchPhotos）
 * 3. 監聽全域鍵盤事件，控制 Lightbox 導覽
 *
 * 鍵盤事件處理策略：
 * - 僅在 Lightbox 開啟時攔截方向鍵與 Escape，
 *   避免影響頁面正常捲動行為。
 * - 事件綁定於 window 層級，確保焦點不在特定元素時仍能捕捉。
 */
import { onMounted, onBeforeUnmount } from 'vue'
import { useGalleryStore } from '@/stores/gallery'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import LightboxViewer from '@/components/LightboxViewer.vue'

const store = useGalleryStore()

function handleKeydown(event) {
  if (!store.lightbox.isOpen) return

  switch (event.key) {
    case 'Escape':
      store.closeLightbox()
      break
    case 'ArrowLeft':
      event.preventDefault()
      store.prevPhoto()
      break
    case 'ArrowRight':
      event.preventDefault()
      store.nextPhoto()
      break
  }
}

onMounted(() => {
  store.fetchPhotos()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.app-main {
  flex: 1;
}

/* 路由切換過渡動畫 */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity var(--transition-normal) var(--ease-out);
}

.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
}
</style>
