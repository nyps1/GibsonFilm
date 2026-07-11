<template>
  <div ref="sentinelRef" class="header-sentinel" aria-hidden="true"></div>
  <header
    ref="headerRef"
    class="app-header"
    :class="{ 'app-header--scrolled': isScrolled, 'app-header--menu-open': isMenuOpen }"
  >
    <div class="app-header__inner">
      <RouterLink to="/" class="app-header__brand" aria-label="Gibson Film">
        Gibson Film
      </RouterLink>

      <nav class="app-header__nav" aria-label="Main navigation">
        <ul class="app-header__nav-list" role="list">
          <li>
            <RouterLink to="/" class="app-header__nav-link" :class="{ active: $route.name === 'home' || $route.name === 'category' }">
              Gallery
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/about" class="app-header__nav-link">
              About Me
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/products" class="app-header__nav-link">
              Products
            </RouterLink>
          </li>
        </ul>
      </nav>

      <button
        class="app-header__hamburger"
        :class="{ 'app-header__hamburger--active': isMenuOpen }"
        :aria-expanded="isMenuOpen"
        aria-label="Toggle navigation menu"
        @click="toggleMenu"
      >
        <span class="app-header__hamburger-line"></span>
        <span class="app-header__hamburger-line"></span>
        <span class="app-header__hamburger-line"></span>
      </button>
    </div>

    <Transition name="slide-down">
      <div v-if="isMenuOpen" class="app-header__mobile-menu">
        <ul class="app-header__mobile-list" role="list">
          <li>
            <RouterLink to="/" class="app-header__mobile-link" @click="closeMenu">Gallery</RouterLink>
          </li>
          <li>
            <RouterLink to="/about" class="app-header__mobile-link" @click="closeMenu">About Me</RouterLink>
          </li>
          <li>
            <RouterLink to="/products" class="app-header__mobile-link" @click="closeMenu">Products</RouterLink>
          </li>
        </ul>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

const isScrolled = ref(false)
const isMenuOpen = ref(false)
const sentinelRef = ref(null)
const headerRef = ref(null)

let observer = null

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && isMenuOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      isScrolled.value = !entry.isIntersecting
    },
    { threshold: 0 }
  )

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value)
  }

  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.header-sentinel {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-header, 100);
  background-color: rgba(15, 14, 23, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition:
    padding var(--transition-normal, 300ms) ease,
    border-color var(--transition-normal, 300ms) ease,
    background-color var(--transition-normal, 300ms) ease;
}

.app-header--scrolled {
  border-bottom-color: rgba(255, 255, 255, 0.08);
  background-color: rgba(15, 14, 23, 0.95);
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 40px;
  transition: padding var(--transition-normal, 300ms) ease;
}

.app-header--scrolled .app-header__inner {
  padding-top: 14px;
  padding-bottom: 14px;
}

.app-header__brand {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-headline, #fffffe);
  text-decoration: none;
  letter-spacing: -0.02em;
  transition: opacity var(--transition-normal, 300ms) ease;
  flex-shrink: 0;
}

.app-header__brand:hover {
  opacity: 0.7;
}

.app-header__nav {
  display: flex;
  align-items: center;
}

.app-header__nav-list {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.app-header__nav-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 18px;
  border-radius: 100px;
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-paragraph, #a7a9be);
  text-decoration: none;
  transition:
    color var(--transition-normal, 300ms) ease,
    background-color var(--transition-normal, 300ms) ease;
  white-space: nowrap;
}

.app-header__nav-link:hover {
  color: var(--color-headline, #fffffe);
  background-color: rgba(255, 255, 255, 0.06);
}

.app-header__nav-link.router-link-active,
.app-header__nav-link.active {
  color: var(--color-button, #ff8906);
}

.app-header__hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.app-header__hamburger-line {
  display: block;
  width: 22px;
  height: 1.5px;
  background-color: var(--color-headline, #fffffe);
  border-radius: 1px;
  transition:
    transform var(--transition-normal, 300ms) ease,
    opacity var(--transition-normal, 300ms) ease;
}

.app-header__hamburger--active .app-header__hamburger-line:nth-child(1) {
  transform: translateY(6.5px) rotate(45deg);
}

.app-header__hamburger--active .app-header__hamburger-line:nth-child(2) {
  opacity: 0;
}

.app-header__hamburger--active .app-header__hamburger-line:nth-child(3) {
  transform: translateY(-6.5px) rotate(-45deg);
}

.app-header__mobile-menu {
  display: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.app-header__mobile-list {
  list-style: none;
  margin: 0;
  padding: 12px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-header__mobile-link {
  display: block;
  padding: 12px 16px;
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-paragraph, #a7a9be);
  text-decoration: none;
  border-radius: 8px;
  transition:
    color var(--transition-normal, 300ms) ease,
    background-color var(--transition-normal, 300ms) ease;
}

.app-header__mobile-link:hover,
.app-header__mobile-link.router-link-active {
  color: var(--color-headline, #fffffe);
  background-color: rgba(255, 255, 255, 0.06);
}

/* Slide-down transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    opacity var(--transition-normal, 300ms) ease,
    transform var(--transition-normal, 300ms) ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

@media (max-width: 768px) {
  .app-header__inner {
    padding: 16px 20px;
  }

  .app-header--scrolled .app-header__inner {
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .app-header__nav {
    display: none;
  }

  .app-header__hamburger {
    display: flex;
  }

  .app-header__mobile-menu {
    display: block;
  }
}
</style>
