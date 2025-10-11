import type { RawLoaderDefinition } from 'webpack'
import { Buffer } from 'node:buffer'
import { relative } from 'node:path'
import { Context } from './common'
import { compress } from './compressor'

const loader: RawLoaderDefinition = async function (source) {
  const id = relative(Context.root, this.resourcePath)

  const result = await compress(id, source)

  if (result.data?.isSmallerThanSourceFile) {
    const buffer = Buffer.from(result.data.compressed)
    source = buffer
  }
  Context.logger?.add(result)

  return source
}

loader.raw = true

export default loader
