/**
 * useIntersectionObserver
 *
 * 捲動進場動畫的觀察器 composable。
 *
 * 設計策略：
 * - 採用「一次性觸發」模式：元素進入視口後立即加上 'is-visible' class
 *   並 unobserve，避免反覆觸發造成不必要的 reflow。
 * - 預設 rootMargin 為 '0px 0px -50px 0px'，
 *   讓元素在距離視口底部 50px 時才觸發，產生更自然的進場時機。
 * - onBeforeUnmount 時 disconnect 整個 observer，釋放所有參照。
 */
import { onBeforeUnmount } from 'vue'

export function useIntersectionObserver(
  options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
) {
  let observer = null

  /**
   * 初始化 IntersectionObserver（延遲建立，首次呼叫 observeElement 時觸發）。
   * 單一 observer 實例可觀察多個元素，比每個元素各建一個 observer 更節省資源。
   */
  function createObserver() {
    if (observer) return

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, {
      threshold: options.threshold,
      rootMargin: options.rootMargin
    })
  }

  /**
   * 開始觀察指定 DOM 元素。
   * 支援直接傳入 HTMLElement 或 Vue template ref。
   *
   * @param {HTMLElement | Ref<HTMLElement>} el - 要觀察的元素
   */
  function observeElement(el) {
    const target = el?.$el ?? el
    if (!target || !(target instanceof HTMLElement)) return

    createObserver()
    observer.observe(target)
  }

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return {
    observeElement
  }
}
