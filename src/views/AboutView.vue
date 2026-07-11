<template>
  <div class="about-view">

    <!-- Hero Section -->
    <section class="about-hero">
      <div class="about-hero__image-wrap">
        <img
          src="/images/about/about-me.jpg"
          alt="About Me"
          class="about-hero__image"
        />
        <div class="about-hero__overlay"></div>
      </div>
      <div class="about-hero__content">
        <p class="about-hero__label">About Me</p>
        <h1 class="about-hero__name">這是我</h1>
        <p class="about-hero__tagline">Capturing life on film — one frame at a time.</p>
        <a
          href="https://www.instagram.com/yan_foo0o0o00oto9raph/"
          target="_blank"
          rel="noopener noreferrer"
          class="about-hero__ig-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
          </svg>
          @yan_foo0o0o00oto9raph
        </a>
      </div>
    </section>

    <!-- Story Section -->
    <section class="about-story">
      <div class="about-story__inner">
        <div class="about-story__text">
          <span class="about-story__eyebrow">The Story</span>
          <h2 class="about-story__heading">Film, Light & Memory</h2>
          <p class="about-story__body">
            I shoot on film because every frame costs something — time, money, and a little bit of luck.
            That friction is what makes it real. Each roll holds moments I chose to preserve,
            not because they are perfect, but because they felt true.
          </p>
          <p class="about-story__body">
            From the mountains of Taiwan to the quiet streets of the city, I carry my Canon A1
            and let light do the rest. This gallery is my ongoing archive —
            an honest record of where I've been and what I've seen.
          </p>
        </div>

        <div class="about-story__gear">
          <span class="about-story__eyebrow">Current Gear</span>
          <ul class="about-gear__list">
            <li class="about-gear__item">
              <span class="about-gear__icon">&#9711;</span>
              <span class="about-gear__name">Canon A1</span>
              <span class="about-gear__detail">35mm SLR</span>
            </li>
            <li class="about-gear__item">
              <span class="about-gear__icon">&#9711;</span>
              <span class="about-gear__name">Fuji S700</span>
              <span class="about-gear__detail">Digital Compact</span>
            </li>
            <li class="about-gear__item">
              <span class="about-gear__icon">&#9711;</span>
              <span class="about-gear__name">Kodak UltraMax 400</span>
              <span class="about-gear__detail">Colour 35mm Film</span>
            </li>
            <li class="about-gear__item">
              <span class="about-gear__icon">&#9711;</span>
              <span class="about-gear__name">Ilford HP5</span>
              <span class="about-gear__detail">Black & White 35mm Film</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Gallery CTA -->
    <section class="about-cta">
      <div class="about-cta__inner">
        <h2 class="about-cta__heading">See the Work</h2>
        <p class="about-cta__sub">Browse the full archive of film photographs.</p>
        <RouterLink to="/" class="about-cta__btn">View Gallery</RouterLink>
      </div>
    </section>

  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.about-view {
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-bg, #0f0e17);
  color: var(--color-headline, #fffffe);
}

/* ---- Hero ---- */
.about-hero {
  position: relative;
  height: 100vh;
  min-height: 640px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.about-hero__image-wrap {
  position: absolute;
  inset: 0;
}

.about-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: grayscale(20%);
}

.about-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(15, 14, 23, 0.1) 0%,
    rgba(15, 14, 23, 0.55) 50%,
    rgba(15, 14, 23, 0.95) 100%
  );
}

.about-hero__content {
  position: relative;
  z-index: 1;
  padding: 0 60px 80px;
  max-width: 800px;
}

.about-hero__label {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-button, #ff8906);
  margin: 0 0 16px;
}

.about-hero__name {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin: 0 0 20px;
  color: var(--color-headline, #fffffe);
}

.about-hero__tagline {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--color-paragraph, #a7a9be);
  margin: 0 0 36px;
  line-height: 1.6;
}

.about-hero__ig-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-headline, #fffffe);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
  transition:
    background var(--transition-normal, 300ms) ease,
    border-color var(--transition-normal, 300ms) ease;
}

.about-hero__ig-btn:hover {
  background: rgba(255, 137, 6, 0.15);
  border-color: var(--color-button, #ff8906);
  color: var(--color-button, #ff8906);
}

/* ---- Story ---- */
.about-story {
  padding: 100px 60px;
}

.about-story__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: start;
}

.about-story__eyebrow {
  display: block;
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-button, #ff8906);
  margin-bottom: 20px;
}

.about-story__heading {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 28px;
  color: var(--color-headline, #fffffe);
}

.about-story__body {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-paragraph, #a7a9be);
  margin: 0 0 20px;
}

.about-gear__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.about-gear__item {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.about-gear__icon {
  color: var(--color-button, #ff8906);
  font-size: 0.75rem;
}

.about-gear__name {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-headline, #fffffe);
}

.about-gear__detail {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.75rem;
  color: var(--color-paragraph, #a7a9be);
  letter-spacing: 0.05em;
}

/* ---- CTA ---- */
.about-cta {
  padding: 80px 60px 120px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  text-align: center;
}

.about-cta__inner {
  max-width: 600px;
  margin: 0 auto;
}

.about-cta__heading {
  font-family: var(--font-serif, 'Playfair Display'), serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
  color: var(--color-headline, #fffffe);
}

.about-cta__sub {
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 1rem;
  color: var(--color-paragraph, #a7a9be);
  margin: 0 0 36px;
}

.about-cta__btn {
  display: inline-flex;
  align-items: center;
  padding: 14px 36px;
  border-radius: 100px;
  background-color: var(--color-button, #ff8906);
  color: var(--color-button-text, #fffffe);
  font-family: var(--font-sans, 'Inter'), sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  transition: filter var(--transition-normal, 300ms) ease;
}

.about-cta__btn:hover {
  filter: brightness(1.1);
}

@media (max-width: 900px) {
  .about-hero__content {
    padding: 0 30px 60px;
  }

  .about-story {
    padding: 60px 30px;
  }

  .about-story__inner {
    grid-template-columns: 1fr;
    gap: 50px;
  }

  .about-cta {
    padding: 60px 30px 80px;
  }
}

@media (max-width: 480px) {
  .about-hero__content {
    padding: 0 20px 48px;
  }

  .about-story {
    padding: 48px 20px;
  }

  .about-cta {
    padding: 48px 20px 64px;
  }
}
</style>
