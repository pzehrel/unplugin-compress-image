import type { FileTypeResult } from 'file-type'
import type { Options } from '../types'
import type { _contextUtils } from '../utils'

type OutputFileType = Uint8Array | ArrayBuffer | null

type ExcludeBoolean<T extends Record<string, any>, KS extends keyof T = keyof T> = {
  [K in KS]: Exclude<T[K], boolean>
} & {
  [EK in Exclude<keyof T, KS>]: T[EK]
}

/**
 * image compressor interface
 */
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
   * whether to enable this compressor
   * @param options
   * @returns
   */
  enable?: (options?: Name extends keyof Options ? ExcludeBoolean<Options, Name> : Options) => boolean | Promise<boolean>

  /**
   * This method is called after the compressor is created, and is only called once.
   * @param ctx
   * @returns
   */
  init?: (ctx: CompressorContext<Name>) => void | Promise<void>

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

export interface CompressorContext<Name extends string = any> {
  options?: Name extends keyof Options ? ExcludeBoolean<Options, Name> : Options
  utils: typeof _contextUtils
}

export interface CompressorFn<Name extends string = any> {
  (context: CompressorContext<Name>): Compressor<Name>
  id: Name
}

type NamelessCompressor = Omit<Compressor<any>, 'name'>

/**
 * define a compressor
 * @param name compressor name
 * @param compressor compressor object or factory function
 */
export function defineCompressor<N extends string>(name: N, compressor: NamelessCompressor | ((compress: CompressorContext<N>) => NamelessCompressor)): CompressorFn<N> {
  if (typeof compressor === 'function') {
    const result: CompressorFn<N> = (context: CompressorContext<N>) => {
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
