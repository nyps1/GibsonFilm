/**
 * Router Configuration
 * Named routes prevent the /:category wildcard from intercepting
 * the dedicated /about, /products, and /admin paths.
 */
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/GalleryView.vue'),
    meta: { title: 'Gibson Film | Photography Gallery' }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: 'About Me | Gibson Film' }
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/ProductsView.vue'),
    meta: { title: 'Products | Gibson Film' }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { title: 'Admin | Gibson Film' }
  },
  // Wildcard category route must come LAST to avoid catching /about, /products, /admin
  {
    path: '/:category',
    name: 'category',
    component: () => import('@/views/GalleryView.vue'),
    meta: { title: 'Gibson Film | Photography Gallery' },
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return { ...savedPosition, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  }
})

// Update document title on route change
router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
})

export default router
