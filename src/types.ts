import type { Compressor } from './compressor/compressor'
import type { JsquashAvifOpts, JsquashMozJpegOpts, JsquashOxiPngOpts, JsquashWebpOpts } from './compressor/jsquash'
import type { SvgoConfig } from './compressor/svgo'

export type Awaitable<T> = T | Promise<T>
export type Arrayable<T> = T | T[]

export type FnAble<R, Args extends any[] = never[]> = R | ((...args: Args) => R)

export interface UserOptions {

  /**
   * tinypng compressor config
   *
   * false to disable tinypng compressor
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
     * - support env inject, use `TINYPNG_KEYS` to inject keys
     * @default process.env.TINYPNG_KEYS
     */
    keys?: Arrayable<string> | (() => Awaitable<Arrayable<string>>)
  }

  /**
   * jsquash compressor config
   *
   * false to disable jsquash compressor
   */
  jsquash?: false | {
    oxipng?: JsquashOxiPngOpts
    mozjpeg?: JsquashMozJpegOpts
    webp?: JsquashWebpOpts
    avif?: JsquashAvifOpts
  }

  svgo?: false | SvgoConfig

  /** custom compressors */
  compressors?: Compressor[]
}

export type ExcludeFalse<T extends Record<string, any>> = {
  [K in keyof T]: Exclude<T[K], false>
}

export type Options = ExcludeFalse<UserOptions>
