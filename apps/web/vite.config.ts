import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build:{rolldownOptions:{input:{main:'index.html',gridReview:'grid-review.html'}}},
  plugins: [VitePWA({
    registerType: 'prompt',
    manifest: {
      name: 'ㅇ 구하기', short_name: 'ㅇ 구하기', lang: 'ko',
      description: '한글 자모 화살표 퍼즐',
      theme_color: '#FFF5D9', background_color: '#FFF5D9',
      display: 'standalone', start_url: '/', scope: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    },
    workbox: {
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,html,png,webmanifest}'],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
      runtimeCaching: []
    }
  })]
});
