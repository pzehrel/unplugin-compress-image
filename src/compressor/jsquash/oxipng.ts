import type { OptimiseOptions } from '@jsquash/oxipng/meta'
import { readFileSync } from 'node:fs'

// @ts-ignore
import WASM from '@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm'
import optimise, { init } from '@jsquash/oxipng/optimise.js'

let installPromise: Promise<any> | null = null
async function install(): Promise<any> {
  if (!installPromise) {
    installPromise = WebAssembly.compile(readFileSync(new URL(WASM, import.meta.url))).then(init)
  }
  return installPromise
}

const DEFAULTS: Partial<OptimiseOptions> = {
  level: 2,
  interlace: false,
  optimiseAlpha: true,
}

export async function compressOxiPng(input: ArrayBuffer, opts?: Partial<OptimiseOptions>): Promise<ArrayBuffer> {
  await install()
  opts = Object.assign({}, DEFAULTS, opts)
  return optimise(input, opts)
}

export type JsquashOxiPngOpts = Partial<OptimiseOptions>
