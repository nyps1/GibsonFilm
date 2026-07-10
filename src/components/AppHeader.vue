<template>
  <div ref="sentinelRef" class="header-sentinel" aria-hidden="true"></div>
  <header
    ref="headerRef"
    class="app-header"
    :class="{ 'app-header--scrolled': isScrolled, 'app-header--menu-open': isMenuOpen }"
  >
    <div class="app-header__inner">
      <a href="/" class="app-header__brand" aria-label="Photo Hub">
        Photo Hub
      </a>

      <nav class="app-header__nav" aria-label="Category navigation">
        <CategoryFilter class="app-header__filters" />
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
        <CategoryFilter @category-change="closeMenu" />
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CategoryFilter from '@/components/CategoryFilter.vue'

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
  background-color: rgba(250, 250, 250, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition:
    padding var(--transition-normal, 300ms) ease,
    border-color var(--transition-normal, 300ms) ease,
    background-color var(--transition-normal, 300ms) ease;
  will-change: padding, border-color;
}

.app-header--scrolled {
  border-bottom-color: var(--color-border, #E8E8E8);
  background-color: rgba(250, 250, 250, 0.92);
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 40px;
  transition: padding var(--transition-normal, 300ms) ease;
  will-change: padding;
}

.app-header--scrolled .app-header__inner {
  padding-top: 12px;
  padding-bottom: 12px;
}

.app-header__brand {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #1A1A1A);
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

.app-header__filters {
  display: block;
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
  background-color: var(--color-text, #1A1A1A);
  border-radius: 1px;
  transition:
    transform var(--transition-normal, 300ms) ease,
    opacity var(--transition-normal, 300ms) ease;
  will-change: transform, opacity;
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
  padding: 0 40px 20px;
  border-top: 1px solid var(--color-border, #E8E8E8);
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
    padding: 12px 20px 20px;
  }
}
</style>
