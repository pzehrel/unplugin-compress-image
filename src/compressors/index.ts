import type { CompressorFn } from '../compressor/types'
import { jsquash } from './jsquash'
import { svgo } from './svgo'

export const builtInCompressors: CompressorFn[] = [jsquash, svgo]

export type { JsquashOptions } from './jsquash'
export type { SvgoConfig } from './svgo'
export type { TinyPngOptions } from './tinypng'
