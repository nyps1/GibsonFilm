/**
 * useProgressiveImage
 *
 * 漸進式圖片載入策略：
 * 1. 先載入低解析度縮圖（thumb），提供即時視覺回饋。
 * 2. 背景以 new Image() 預載全解析度圖片（src）。
 * 3. 全解析度載入完成後，透過 isLoaded 旗標通知模板切換顯示。
 *
 * 記憶體管理：
 * - onBeforeUnmount 時將預載 Image 的 src 清空，
 *   中斷進行中的網路請求，避免元件已銷毀後仍觸發回呼。
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

export function useProgressiveImage({ src, thumb }) {
  const isLoaded = ref(false)
  const thumbLoaded = ref(false)
  const imageRef = ref(null)

  let preloader = null
  let thumbPreloader = null

  /**
   * 預載全解析度圖片。
   * 使用原生 Image 物件，不插入 DOM，純粹觸發瀏覽器快取。
   */
  function loadFullImage(imageSrc) {
    cleanup()
    isLoaded.value = false

    if (!imageSrc) return

    preloader = new Image()

    preloader.onload = () => {
      isLoaded.value = true
      preloader = null
    }

    preloader.onerror = () => {
      console.error('[useProgressiveImage] Failed to load:', imageSrc)
      preloader = null
    }

    preloader.src = imageSrc
  }

  /**
   * 預載縮圖。
   */
  function loadThumb(thumbSrc) {
    if (!thumbSrc) return

    thumbPreloader = new Image()

    thumbPreloader.onload = () => {
      thumbLoaded.value = true
      thumbPreloader = null
    }

    thumbPreloader.onerror = () => {
      thumbPreloader = null
    }

    thumbPreloader.src = thumbSrc
  }

  /**
   * 清除預載器，中斷進行中的網路請求。
   * 將 src 設為空字串是中斷瀏覽器圖片載入的標準做法。
   */
  function cleanup() {
    if (preloader) {
      preloader.onload = null
      preloader.onerror = null
      preloader.src = ''
      preloader = null
    }
    if (thumbPreloader) {
      thumbPreloader.onload = null
      thumbPreloader.onerror = null
      thumbPreloader.src = ''
      thumbPreloader = null
    }
  }

  onMounted(() => {
    loadThumb(typeof thumb === 'object' && thumb.value !== undefined ? thumb.value : thumb)
    loadFullImage(typeof src === 'object' && src.value !== undefined ? src.value : src)
  })

  // 支援響應式 src 參數（例如 Lightbox 切換照片時）
  if (typeof src === 'object' && src.value !== undefined) {
    watch(src, (newSrc) => {
      isLoaded.value = false
      thumbLoaded.value = false
      loadThumb(typeof thumb === 'object' && thumb.value !== undefined ? thumb.value : thumb)
      loadFullImage(newSrc)
    })
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    isLoaded,
    thumbLoaded,
    imageRef
  }
}
