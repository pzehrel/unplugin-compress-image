import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
// eslint-disable-next-line antfu/no-import-dist
import Unplugin from '../dist/vite'

export default defineConfig({
  plugins: [
    Inspect(),
    Unplugin(),
  ],

  build: {
    // assetsInlineLimit: 0,
  },
})
