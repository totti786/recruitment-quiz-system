import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://127.0.0.1/',
      },
    },
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.*',
      ],
    },
  },
})
