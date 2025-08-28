import type { Buffer } from 'node:buffer'
import type { Compressor, FileDataType } from '../compressor'
import type { Options } from '../types'
import { CompressCache } from '../cache'
import { runCompressorsByBestSize } from '../compressor'
import { CompressLogger } from '../logger'
import { CompressError, runParallel } from '../utils'

export interface CompressOpts {
  root: string
  sources: Record<string, FileDataType>
  options?: Options
}

interface Success {
  filepath: string
  source: FileDataType
  dest: Buffer
  compressor: Compressor | 'cache'
}

interface Fail {
  filepath: string
  source: FileDataType
  error: CompressError
}

interface Result {
  files: Success[]
  logger: CompressLogger
}

export async function compress(opts: CompressOpts): Promise<Result> {
  const options = { ...opts.options, root: opts.root }
  const sources = opts.sources

  const cache = options?.cache === false ? undefined : new CompressCache(options.root, options.cache?.dir)
  const logger = new CompressLogger()

  const tasks = Object.entries(sources).map<() => Promise<Success | Fail>>(([filepath, source]) => async () => {
    const cacheFile = cache?.get(source)
    if (cacheFile) {
      logger.push({ id: filepath, before: source.byteLength, after: cacheFile.byteLength, compressor: 'cache' })
      return { filepath, source, dest: cacheFile, compressor: 'cache' }
    }

    const dest = await runCompressorsByBestSize(source, options)

    if (CompressError.is(dest)) {
      logger.push({ id: filepath, error: dest })
      return { filepath, source, error: dest }
    }
    const { file, compressor } = dest
    cache?.save(source, file)
    logger.push({ id: filepath, before: source.byteLength, after: file.byteLength, compressor: compressor.name })
    return { filepath, source, dest: file, compressor }
  })

  const files = (await Promise.all(tasks.map(task => task()))).filter(r => 'dest' in r)

  // const files = (await runParallel(tasks, task => task())).filter(r => 'dest' in r)

  return { files, logger }
}
