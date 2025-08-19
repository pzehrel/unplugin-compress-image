import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/test.ts'],
  clean: true,
  loader: { '.wasm': 'asset' },
  noExternal: [/.*\.wasm$/],
})
