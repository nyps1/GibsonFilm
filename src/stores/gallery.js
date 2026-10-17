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
import { ref, shallowRef, computed } from 'vue'

/**
 * 將圖片路徑進行安全之 URI 編碼，確保包含空白、中文字元、# 或 + 之檔名能由瀏覽器與邊緣節點正確解析。
 * @param {string} rawUrl - 原始圖片相對路徑。
 * @returns {string} 編碼後的安全 URI 字串。
 */
function encodePhotoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  try {
    const decoded = decodeURI(rawUrl)
    return encodeURI(decoded).replace(/#/g, '%23').replace(/\+/g, '%2B')
  } catch {
    return encodeURI(rawUrl).replace(/#/g, '%23').replace(/\+/g, '%2B')
  }
}

export const useGalleryStore = defineStore('gallery', () => {
  // -- State --
  // 使用 shallowRef 避免對上千筆唯讀照片物件建立深層 Proxy，大幅降低記憶體分配與 GC 壓力
  const photos = shallowRef([])
  const categories = ref([])
  const randomPhotos = shallowRef([])
  const activeCategory = ref('random')
  const lightbox = ref({
    isOpen: false,
    currentIndex: 0
  })
  const isLoading = ref(true)
  const error = ref(null)

  // -- Getters --

  /**
   * 依 activeCategory 篩選照片。
   * 'random' 或未指定時回傳隨機挑選的 100 張照片，否則比對 category 欄位。
   * @returns {Array<Object>} 篩選後的照片物件陣列。
   */
  const filteredPhotos = computed(() => {
    if (!activeCategory.value || activeCategory.value === 'random' || activeCategory.value === 'all') {
      return randomPhotos.value
    }
    return photos.value.filter(
      (photo) => photo.category === activeCategory.value
    )
  })

  /**
   * 目前 Lightbox 顯示的照片物件。
   * 基於 filteredPhotos 索引，確保分類切換後不會取到錯誤照片。
   * @returns {Object|null} 當前檢視的照片物件或 null。
   */
  const currentPhoto = computed(() => {
    if (!lightbox.value.isOpen || filteredPhotos.value.length === 0) {
      return null
    }
    return filteredPhotos.value[lightbox.value.currentIndex] ?? null
  })

  /**
   * Hero 照片：優先取 hero: true 的第一張，否則回傳陣列首項。
   * @returns {Object|null} 主視覺照片物件或 null。
   */
  const heroPhoto = computed(() => {
    const hero = photos.value.find((photo) => photo.hero === true)
    return hero ?? photos.value[0] ?? null
  })

  // -- Actions --

  /**
   * 使用 Fisher-Yates 洗牌演算法從全量照片中隨機抽取最多 100 張照片更新至 randomPhotos。
   * @param {number} [limit=100] - 隨機抽取的張數上限。
   * @returns {Array<Object>} 隨機抽取出的照片陣列。
   */
  function shuffleRandomPhotos(limit = 100) {
    const shuffled = [...photos.value]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }
    randomPhotos.value = shuffled.slice(0, limit)
    return randomPhotos.value
  }

  /**
   * 從靜態 JSON 載入照片資料。
   * 排序依據 sortOrder 欄位（升冪），並於載入階段統一正規化圖片 URI 編碼。
   * @returns {Promise<void>}
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

      let loadedPhotos = []
      let loadedCategories = []

      if (Array.isArray(data)) {
        loadedPhotos = data
        const uniqueCategories = [...new Set(data.map((p) => p.category).filter(Boolean))]
        loadedCategories = uniqueCategories.map((cat) => ({
          id: cat,
          name: cat.charAt(0).toUpperCase() + cat.slice(1)
        }))
      } else if (data && typeof data === 'object') {
        loadedPhotos = data.photos ?? []
        loadedCategories = data.categories ?? []
      }

      photos.value = [...loadedPhotos]
        .map((p) => ({
          ...p,
          rawSrc: p.src,
          src: encodePhotoUrl(p.src)
        }))
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))

      categories.value = loadedCategories.filter((c) => c.id !== 'all')

      shuffleRandomPhotos(100)

      if (!activeCategory.value || activeCategory.value === 'all') {
        activeCategory.value = 'random'
      }
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
   * @param {string} category - 目標分類 ID。
   * @returns {void}
   */
  function setCategory(category) {
    activeCategory.value = category
    closeLightbox()
  }

  /**
   * 開啟 Lightbox，index 對應 filteredPhotos 的位置。
   * @param {number} index - 欲開啟照片於 filteredPhotos 中的索引。
   * @returns {void}
   */
  function openLightbox(index) {
    if (index < 0 || index >= filteredPhotos.value.length) return
    lightbox.value.isOpen = true
    lightbox.value.currentIndex = index
  }

  /**
   * 關閉 Lightbox 並將索引歸零。
   * @returns {void}
   */
  function closeLightbox() {
    lightbox.value.isOpen = false
    lightbox.value.currentIndex = 0
  }

  /**
   * 切換至下一張照片（循環）。
   * 使用模除運算避免索引越界。
   * @returns {void}
   */
  function nextPhoto() {
    const total = filteredPhotos.value.length
    if (total === 0) return
    lightbox.value.currentIndex = (lightbox.value.currentIndex + 1) % total
  }

  /**
   * 切換至上一張照片（循環）。
   * @returns {void}
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
    randomPhotos,
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
    shuffleRandomPhotos,
    setCategory,
    openLightbox,
    closeLightbox,
    nextPhoto,
    prevPhoto
  }
})
