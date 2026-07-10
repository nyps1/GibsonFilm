# Personal Photo Hub

A minimalist, high-performance photography portfolio built with **Vue 3**, **Vite**, and **Cloudflare Pages**.

This project focuses on a premium visual experience with zero-cost deployment, engineered for extreme performance and smooth micro-interactions.

## 🚀 Architecture (Phase 1: MVP)

- **Frontend Framework:** Vue 3 (Composition API) + Vite
- **State Management:** Pinia
- **Routing:** Vue Router 4
- **Styling:** Vanilla CSS Custom Properties (Zero CSS framework dependencies)
- **Data Layer:** Local CMS via `public/data/photos.json`
- **Hosting:** Cloudflare Pages (Global Edge CDN)
- **Deployment:** GitHub Auto-deployment CI/CD

## ✨ Features (The "Wow Factor")

- **Zero-Cost Operation:** Fully static architecture hosted on Cloudflare's free tier.
- **Bento / Masonry Grid:** Dynamic image layouts generated through pure CSS Grid math, without heavy JavaScript libraries.
- **Progressive Image Loading:** Images initially load as lightweight blurred placeholders and smoothly fade into full-resolution WebP/PNGs.
- **Immersive Micro-Interactions:** Subtle scale transitions, backdrop filters, and hover overlays reveal detailed film metadata (ISO, Film Stock, Location).
- **Responsive Lightbox:** A custom-built, full-screen image viewer supporting keyboard navigation, touch swipe gestures, and adjacent image preloading.
- **Scroll Reveal Animations:** IntersectionObserver-driven reveal animations that cascade beautifully as the user scrolls.

## 🛠️ Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nyps1/GibsonFilm.git
   cd GibsonFilm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📸 Updating the Gallery (Local CMS Workflow)

The gallery is managed via a static JSON file. To add new photos:

1. **Optimize Images:** Convert and resize your photos (e.g., max width 2000px).
2. **Generate Thumbnails:** Create highly blurred, very low-resolution versions of your photos.
3. **Upload Files:**
   - Place full-resolution images in `public/images/gallery/`
   - Place thumbnails in `public/images/thumbs/`
4. **Update Metadata:** Edit `public/data/photos.json` to include the new entries. Example entry:
   ```json
   {
     "id": 13,
     "title": "New Mountain Shot",
     "src": "/images/gallery/new-photo.png",
     "thumb": "/images/thumbs/new-photo-thumb.png",
     "category": "landscape",
     "filmStock": "Kodak Portra 400",
     "iso": "400",
     "location": "Central Peak, Taiwan",
     "annotation": "High-altitude shot from the peak.",
     "aspectRatio": 1.5,
     "hero": false,
     "sortOrder": 13
   }
   ```
5. **Deploy:** `git push` to your main branch. Cloudflare Pages will automatically rebuild and deploy within seconds.

## 🎬 Updating Cinematic Hero Assets

The homepage features an 800vh cinematic scroll sequence (`HeroScrollSequence.vue`). To update the assets used in this sequence, replace the files in the following paths with your own high-quality images:

1. **Camera Assets (public/images/cameras/)**
   - `canon-a1.png`: Replace this with your transparent background image of the camera's front view.
   - `camera-viewfinder-placeholder.png`: Replace this with the transparent background image of the camera's rear viewfinder. Ensure the viewfinder opening is appropriately centered or adjust the `transform-origin` in the code.
   
2. **Curated Fullscreen Photos (public/images/gallery/)**
   - The sequence currently uses `photo-01.png`, `photo-04.png`, and `photo-06.png` as the three sequential fade-in showcase images.
   - You can overwrite these files or change the referenced filenames directly in `src/components/HeroScrollSequence.vue`.

## 🗺️ Roadmap (Phase 2)

In the future, to support an admin upload interface without traditional servers, the architecture will be expanded within the Cloudflare ecosystem:
- **Cloudflare Pages Functions:** Serverless API for authentication and upload coordination.
- **Cloudflare R2:** S3-compatible, zero-egress object storage for handling massive image libraries.
- **Cloudflare D1:** SQLite database at the edge for managing dynamic photo metadata and categories.

---
*Architected and developed by the Antigravity Lead Architect AI.*
