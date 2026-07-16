import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/todo/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*'],
      manifest: {
        name: 'Todo App',
        short_name: 'Todo',
        description: 'A simple daily task manager',
        theme_color: '#6366f1',
        background_color: '#f0f2f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/todo/',
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js'
    })
  ]
})
