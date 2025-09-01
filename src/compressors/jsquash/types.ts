import type { EncodeOptions as AvifOptions } from '@jsquash/avif/meta'
import type { EncodeOptions as JpegOptions } from '@jsquash/jpeg/meta'
import type { OptimiseOptions as OxipngOptions } from '@jsquash/oxipng/meta'
import type { EncodeOptions as WebpOptions } from '@jsquash/webp/meta'

export interface JsquashOptions {
  avif?: Partial<AvifOptions>
  mozjpeg?: Partial<JpegOptions>
  oxipng?: Partial<OxipngOptions>
  webp?: Partial<WebpOptions>
}
