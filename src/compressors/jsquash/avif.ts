import type { EncodeOptions } from '@jsquash/avif/meta'
import { readFileSync } from 'node:fs'
import decWasm from '@jsquash/avif/codec/dec/avif_dec.wasm'
import encWasm from '@jsquash/avif/codec/enc/avif_enc.wasm'
import decode, { init as decodeInit } from '@jsquash/avif/decode.js'
import encode, { init as encodeInit } from '@jsquash/avif/encode.js'

function compile(wasmFilePath: string): Promise<WebAssembly.Module> {
  return WebAssembly.compile(readFileSync(new URL(wasmFilePath, import.meta.url)))
}

let installPromise: Promise<any> | null = null
function install(): Promise<any> {
  if (!installPromise) {
    installPromise = Promise.all([
      compile(decWasm).then(decodeInit),
      compile(encWasm).then(encodeInit),
    ])
  }

  return installPromise
}

export async function compressAvif(buffer: ArrayBuffer, options?: Partial<EncodeOptions>): Promise<ArrayBuffer> {
  await install()
  const imageData = await decode(buffer)
  if (!imageData) {
    throw new Error('Failed to decode image data')
  }
  return encode(imageData, options as any)
}

export type JsquashAvifOpts = Partial<EncodeOptions>
