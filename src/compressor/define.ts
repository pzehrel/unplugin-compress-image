import type { FileTypeResult } from 'file-type'
import type { Options } from '../types'

export type Base64 = string
export type FileDataType = ArrayBuffer | Uint8Array | Base64

export interface CompressorOptions extends Options {
  root: string
}

export interface Compressor {
  name: string
  test?: RegExp | ((fileType: FileTypeResult, options?: Options) => boolean)
  compress: (input: ArrayBuffer, fileType: FileTypeResult, options: Options) => Promise<FileDataType | false>
}

export function defineCompressor(compressor: Compressor | (() => Compressor)): Compressor {
  return typeof compressor === 'function' ? compressor() : compressor
}
