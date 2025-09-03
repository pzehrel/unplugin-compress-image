import type { CompressorFn } from '../compressor/types'
import type { Options } from '../types'
import { jsquash } from './jsquash'
import { svgo } from './svgo'
import { tinypng } from './tinypng'

export const builtInCompressors: CompressorFn[] = [jsquash, svgo, tinypng]

export function getBuiltInCompressors(options?: Options): CompressorFn[] {
  return builtInCompressors.filter((fn) => {
    if (options && fn.id in options && (options as any)[fn.id] === false) {
      return false
    }
    return true
  })
}

export type { JsquashOptions } from './jsquash'
export type { SvgoConfig } from './svgo'
export type { TinyPngOptions } from './tinypng'
