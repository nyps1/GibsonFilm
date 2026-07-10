/**
 * Router 設定
 * 路由策略：首頁與分類頁共用同一 GalleryView 元件，
 * 透過 route.params.category 區分篩選邏輯。
 * 使用 createWebHistory 搭配 HTML5 History API。
 */
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/GalleryView.vue'),
    meta: { title: 'Photo Hub | Film Photography Gallery' }
  },
  {
    path: '/:category',
    name: 'category',
    component: () => import('@/views/GalleryView.vue'),
    meta: { title: 'Photo Hub | Film Photography Gallery' },
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  /**
   * scrollBehavior
   * 路由切換時平滑捲動至頂部。
   * 若帶有 savedPosition（瀏覽器前進/後退），則回復至上次位置。
   */
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return { ...savedPosition, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  }
})

export default router
