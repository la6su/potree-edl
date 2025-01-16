import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  resolve: {
  },
  optimizeDeps: {
    exclude: ['potree'],
    esbuildOptions: {
      loader: {
        ".glsl": "text",
      },
    },
  },
  plugins: [
    glsl(),
  ],
})
