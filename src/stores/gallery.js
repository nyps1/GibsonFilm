/**
 * Gallery Store (Pinia)
 *
 * 職責：
 * 1. 照片資料的獲取與快取
 * 2. 分類篩選邏輯
 * 3. Lightbox 開關與索引管理
 *
 * 設計決策：
 * - filteredPhotos 使用 getter 而非 action，確保響應式自動更新。
 * - Lightbox 索引基於 filteredPhotos 陣列，切換分類後索引不會越界。
 * - nextPhoto / prevPhoto 使用模除運算實作循環切換。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGalleryStore = defineStore('gallery', () => {
  // -- State --
  const photos = ref([])
  const categories = ref([])
  const activeCategory = ref('all')
  const lightbox = ref({
    isOpen: false,
    currentIndex: 0
  })
  const isLoading = ref(true)
  const error = ref(null)

  // -- Getters --

  /**
   * 依 activeCategory 篩選照片。
   * 'all' 回傳完整列表，否則比對 category 欄位。
   */
  const filteredPhotos = computed(() => {
    if (activeCategory.value === 'all') {
      return photos.value
    }
    return photos.value.filter(
      (photo) => photo.category === activeCategory.value
    )
  })

  /**
   * 目前 Lightbox 顯示的照片物件。
   * 基於 filteredPhotos 索引，確保分類切換後不會取到錯誤照片。
   */
  const currentPhoto = computed(() => {
    if (!lightbox.value.isOpen || filteredPhotos.value.length === 0) {
      return null
    }
    return filteredPhotos.value[lightbox.value.currentIndex] ?? null
  })

  /**
   * Hero 照片：優先取 hero: true 的第一張，否則回傳陣列首項。
   */
  const heroPhoto = computed(() => {
    const hero = photos.value.find((photo) => photo.hero === true)
    return hero ?? photos.value[0] ?? null
  })

  // -- Actions --

  /**
   * 從靜態 JSON 載入照片資料。
   * 排序依據 sortOrder 欄位（升冪）。
   * 分類清單從回應中的 categories 陣列取得。
   */
  async function fetchPhotos() {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/data/photos.json')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      photos.value = [...data.photos].sort(
        (a, b) => a.sortOrder - b.sortOrder
      )

      categories.value = data.categories ?? []
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('[gallery store] fetchPhotos failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 設定目前篩選分類。
   * 同時關閉 Lightbox 並重置索引，避免索引越界。
   */
  function setCategory(category) {
    activeCategory.value = category
    closeLightbox()
  }

  /**
   * 開啟 Lightbox，index 對應 filteredPhotos 的位置。
   */
  function openLightbox(index) {
    if (index < 0 || index >= filteredPhotos.value.length) return
    lightbox.value.isOpen = true
    lightbox.value.currentIndex = index
  }

  function closeLightbox() {
    lightbox.value.isOpen = false
    lightbox.value.currentIndex = 0
  }

  /**
   * 切換至下一張照片（循環）。
   * 使用模除運算避免索引越界。
   */
  function nextPhoto() {
    const total = filteredPhotos.value.length
    if (total === 0) return
    lightbox.value.currentIndex = (lightbox.value.currentIndex + 1) % total
  }

  /**
   * 切換至上一張照片（循環）。
   */
  function prevPhoto() {
    const total = filteredPhotos.value.length
    if (total === 0) return
    lightbox.value.currentIndex =
      (lightbox.value.currentIndex - 1 + total) % total
  }

  return {
    // State
    photos,
    categories,
    activeCategory,
    lightbox,
    isLoading,
    error,
    // Getters
    filteredPhotos,
    currentPhoto,
    heroPhoto,
    // Actions
    fetchPhotos,
    setCategory,
    openLightbox,
    closeLightbox,
    nextPhoto,
    prevPhoto
  }
})
