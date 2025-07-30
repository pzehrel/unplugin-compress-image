export enum Engine {
  JSQUASH,
  IMAGEMIN,
  TINYPNG_WEB,
  TINYPNG_API,
}

export type Extnames = 'png' | 'jpg' | 'webp' | 'avif'

export interface Options {
  png?: Engine[]
  jpg?: Engine[]
  webp?: Engine[]
  avif?: Engine[]

  tinypng?: {
    keys: string | string[] | (() => string | string[] | Promise<string | string[]>)
  }
}
