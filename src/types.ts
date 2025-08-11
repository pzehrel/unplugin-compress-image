import type { Compressor } from './compressor'

export type Awaitable<T> = T | Promise<T>
export type Arrayable<T> = T | T[]

export type FnAble<R, Args extends any[] = never[]> = R | ((...args: Args) => R)

export type Extnames = 'png' | 'jpg' | 'webp' | 'avif' | (string & {})

export interface Options {

  /**
   * 为每种格式指定一个压缩器
   */
  compressors?: Compressor[] | {
    /** [首选压缩器, ...其他压缩器] */
    [key in Extnames]?: [Compressor, ...Compressor[]]
  }

  tinypng?: {
    /**
     * TinyPNG API 地址
     * @default 'https://api.tinify.com/shrink'
     */
    api?: string
    /**
     * TinyPNG API Key
     * 可以是单个字符串或字符串数组
     * @default process.env.TINYPNG_API_KEY
     */
    keys?: Arrayable<string> | (() => Awaitable<Arrayable<string>>)
  }
}
