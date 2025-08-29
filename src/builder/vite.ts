import type { VitePlugin } from 'unplugin'
import type { Options } from '../types'
import MagicString from 'magic-string'
import { compressOne } from '../compress'
import { CompressLogger } from '../logger'
import { toBase64 } from '../utils'

export function createVitePlugin(options?: Options): Partial<VitePlugin> {
  const logger = new CompressLogger()

  return {
    async generateBundle(_, bundle) {
      const queue: Promise<any>[] = []
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && typeof file.source !== 'string') {
          const task = compressOne({ id: file.fileName, source: file.source, logger, options })
          queue.push(task)
          task.then((res) => {
            if (res) {
              file.source = res
            }
          })
        }
        if (options?.base64 !== false) {
          if (file.type === 'chunk' && typeof file.code === 'string') {
            replaceBase64Images(file.code, async (source, index) => {
              const task = compressOne({ id: `${file.fileName} ${index}`, source, logger, options })
              queue.push(task)
              return task.catch(() => null).then((res) => {
                if (res) {
                  return toBase64(res)
                }
                return null
              })
            }).then((code) => {
              file.code = code
            })
          }
        }
      }

      await Promise.all(queue)
    },

    closeBundle() {
      logger.table()
    },
  }
}

async function replaceBase64Images(code: string, replace: (source: string, index: number) => Promise<string | null>): Promise<string> {
  const mc = new MagicString(code)

  const REG = /data:image\/[^;]+;base64,[A-Za-z0-9+/]+={0,2}/g

  let match: RegExpExecArray | null | undefined
  let index = 0

  while (match !== null) {
    match = REG.exec(code)
    if (!match) {
      break
    }

    const source = match[0]

    const dest = await replace(source, index++)
    if (dest) {
      mc.replace(source, dest)
    }
  }

  return mc.toString()
}
