import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/*.ts', 'src/compressor/index.ts'],
    clean: true,
    loader: { '.wasm': 'asset' },
    noExternal: [/.*\.wasm$/],
  },
  {
    entry: ['src/*.ts', 'src/compressor/index.ts'],
    format: ['cjs'],
    loader: { '.wasm': 'asset' },
    // file-type and @jsquash/* use ESM export, we need to bundle them
    noExternal: [/.*\.wasm$/, 'file-type', /@jsquash*/],
  },
])
