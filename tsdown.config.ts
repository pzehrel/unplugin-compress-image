import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/*.ts', 'src/compressor/index.ts'],
  clean: true,
  loader: { '.wasm': 'asset' },
  noExternal: [/.*\.wasm$/],
})
