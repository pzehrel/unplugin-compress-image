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

export type CompressorFnContext<Name extends string = any> = typeof _contextUtils & { options?: Name extends keyof Options ? ExcludeBoolean<Options, Name> : Options }

export interface CompressorFn<Name extends string = any> {
  (context: CompressorFnContext<Name>): Compressor<Name>
  id: Name
}

export function defineCompressor<N extends string, C extends Omit<Compressor<N>, 'name'>>(name: N, compressor: C | ((compress: CompressorFnContext<N>) => C)): CompressorFn<N> {
  if (typeof compressor === 'function') {
    const result: CompressorFn<N> = (context: CompressorFnContext<N>) => {
      const c = compressor(context)
      return { name, ...c }
    }
    result.id = name
    return result
  }

  const result: CompressorFn<N> = () => ({ name, ...compressor })
  result.id = name
  return result
}

export type ExcludeBoolean<T extends Record<string, any>, KS extends keyof T = keyof T> = {
  [K in KS]: Exclude<T[K], boolean>
} & {
  [EK in Exclude<keyof T, KS>]: T[EK]
}
