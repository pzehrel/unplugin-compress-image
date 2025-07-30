import type { Buffer } from 'node:buffer'
import type { Options } from '../types'
import type { Awaitable, FnAble } from './utils'

export interface CompressInput {
  // filepath: string
  // filename: string
  file: Uint8Array
  // mimeType: string
  // onProgress: (progress: number) => void
}

export type Compress = (input: CompressInput, options: Options) => Awaitable<Uint8Array | Buffer | ArrayBuffer>

export interface Compressor {
  name: string
  test?: FnAble<RegExp>
  canuse?: (options: Options) => boolean
  compress: Compress
}
