import type { FileTypeResult } from 'file-type'
import type { Buffer } from 'node:buffer'
import type { Awaitable, ExcludeFalse, Options } from '../types'

export type SupportType = ArrayBuffer | Buffer

export interface Compressor {
  name: string
  test?: RegExp | ((fileType: FileTypeResult, options?: Options) => boolean)
  compress: (input: ArrayBuffer, fileType: FileTypeResult, options?: ExcludeFalse<Options>) => Awaitable<SupportType>
}

export function defineCompressor(compressor: Compressor | (() => Compressor)): Compressor {
  return typeof compressor === 'function' ? compressor() : compressor
}
