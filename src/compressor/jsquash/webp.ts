import type { EncodeOptions } from '@jsquash/webp/meta'
import { readFileSync } from 'node:fs'
import decWasm from '@jsquash/webp/codec/dec/webp_dec.wasm'
import encWasm from '@jsquash/webp/codec/enc/webp_enc.wasm'
import decode, { init as decodeInit } from '@jsquash/webp/decode.js'
import encode, { init as encodeInit } from '@jsquash/webp/encode.js'

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

export async function compressWebp(buffer: ArrayBuffer, options?: Partial<EncodeOptions>): Promise<ArrayBuffer> {
  await install()
  const imageData = await decode(buffer)
  return encode(imageData, options)
}

export type JsquashWebpOpts = Partial<EncodeOptions>
