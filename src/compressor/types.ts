import type { FileTypeResult } from 'file-type'
import type { Options } from '../types'
import type { _contextUtils } from '../utils'

type OutputFileType = Uint8Array | ArrayBuffer | null

export interface Compressor<Name extends string = any> {
  /** compressor name */
  name: Name

  /**
   * match file types
   *
   * @default '() => true'
   */
  use?: RegExp | ((fileType: FileTypeResult) => boolean)

  /**
   * compress image
   * @param source input file data
   * @param fileType file type from `file-type` package
   * @param options user options
   * @returns compressed file data
   */
  compress: (
    source: Uint8Array,
    fileType: FileTypeResult,
    options?: Name extends keyof Options ? ExcludeBoolean<Options, Name> : Options,
  ) => Promise<OutputFileType> | OutputFileType
}

export type CompressorFnContext = typeof _contextUtils & { options?: Options }

export interface CompressorFn<Name extends string = any> {
  (context: CompressorFnContext): Compressor<Name>
}

export function defineCompressor<Name extends string = any>(compressor: Compressor<Name> | CompressorFn<Name>): CompressorFn<Name> {
  return typeof compressor === 'function' ? compressor : () => compressor
}

export type ExcludeBoolean<T extends Record<string, any>, KS extends keyof T = keyof T> = {
  [K in KS]: Exclude<T[K], boolean>
} & {
  [EK in Exclude<keyof T, KS>]: T[EK]
}
