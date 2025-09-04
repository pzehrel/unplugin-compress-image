import type { LoggerOptions } from './common'
import type { Compressor, CompressorFn } from './compressor'
import type { JsquashOptions, SvgoConfig, TinyPngOptions } from './compressors'

export type Base64 = `data:${string}/${string};base64,${string}` | (string & {})

/** JS code or CSS code */
export type Code = (string & {})

/** Supported file types */
export type FileDataType = ArrayBuffer | Uint8Array

export interface Options {

  /**
   * TinyPNG compressor configuration
   *
   * Set to false to disable TinyPNG compressor
   *
   * @default false
   */
  tinypng?: false | TinyPngOptions

  /**
   * Jsquash compressor configuration
   *
   * Set to false to disable Jsquash compressor
   *
   */
  jsquash?: false | JsquashOptions

  /**
   * SVGO compressor configuration
   *
   * Set to false to disable SVGO compressor
   */
  svgo?: false | SvgoConfig

  /**
   * Custom compressors
   *
   * You can use `defineCompressor` to define a custom compressor
   */
  compressors?: (Compressor | CompressorFn)[]

  /**
   * Enable cache
   *
   * If using TinyPNG or other remote compressors, it is recommended to enable cache
   *
   */
  cache?: false | {
    /**
     * Cache directory
     *
     * @default '{cwd}/node_modules/.compress-image-cache'
     */
    dir?: string
  }

  /**
   * Show logger
   * @default true
   */
  logger?: false | LoggerOptions

  /**
   * Compress base64-formatted images in JS/CSS files
   *
   * Only Rollup-like builders support this feature currently
   *
   * @default true
   */
  base64?: boolean
}
