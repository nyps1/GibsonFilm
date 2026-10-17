import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(async () => {
  const plugins = [vue()]

  // Dynamically import @cloudflare/vite-plugin only if Node version >= 22
  // to avoid SyntaxError: registerHooks in node:module on Node v20
  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10)
  if (nodeMajor >= 22) {
    try {
      const { cloudflare } = await import('@cloudflare/vite-plugin')
      plugins.push(cloudflare())
    } catch (e) {
      console.warn('Could not load @cloudflare/vite-plugin:', e)
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})