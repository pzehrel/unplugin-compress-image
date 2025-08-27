import type { Compressor } from './compressor/define'
import type { JsquashAvifOpts, JsquashMozJpegOpts, JsquashOxiPngOpts, JsquashWebpOpts } from './compressor/jsquash'
import type { SvgoConfig } from './compressor/svgo'

export type Awaitable<T> = T | Promise<T>
export type Arrayable<T> = T | T[]

export type FnAble<R, Args extends any[] = never[]> = R | ((...args: Args) => R)

export interface Options {

  /**
   * TinyPNG compressor configuration
   *
   * Set to false to disable TinyPNG compressor
   *
   * @default false
   */
  tinypng?: false | {
    /**
     * TinyPNG API Endpoint
     * @default 'https://api.tinify.com/shrink'
     */
    api?: string
    /**
     * TinyPNG API Keys
     *
     * - Supports environment variable injection; use `TINYPNG_KEYS` to inject keys
     * @default process.env.TINYPNG_KEYS
     */
    keys?: Arrayable<string> | (() => Awaitable<Arrayable<string>>)
  }

  /**
   * Jsquash compressor configuration
   *
   * Set to false to disable Jsquash compressor
   *
   */
  jsquash?: false | {
    oxipng?: JsquashOxiPngOpts
    mozjpeg?: JsquashMozJpegOpts
    webp?: JsquashWebpOpts
    avif?: JsquashAvifOpts
  }

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
  compressors?: Compressor[]

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
   * show logger
   * @default true
   */
  logger?: boolean
}

export type ExcludeFalse<T extends Record<string, any>> = {
  [K in keyof T]: Exclude<T[K], false>
}

// export type Options = ExcludeFalse<UserOptions>
