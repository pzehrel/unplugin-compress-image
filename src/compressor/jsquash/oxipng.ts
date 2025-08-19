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

export async function compressOxiPng(input: ArrayBuffer, opts?: Partial<OptimiseOptions>): Promise<ArrayBuffer> {
  await install()
  return optimise(input, opts)
}

export type JsquashOxiPngOpts = Partial<OptimiseOptions>
