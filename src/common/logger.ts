import { CompressError } from '../utils'

interface Success {
  success: true
  /** file name */
  id: string
  before: number
  after: number
  rate: number
  /** compressor name */
  compressor: string
}
interface Fail {
  success: false
  id: string
  error: CompressError
}

interface Statistics {
  files: number
  successes: Success[]
  fails: Fail[]
  before: number
  after: number
  rate: number
}

export class CompressLogger {
  private successes: Success[] = []
  private errors: Fail[] = []

  success(id: string, source: Uint8Array, output: Uint8Array, compressor?: string): void {
    this.successes.push({
      success: true,
      id,
      before: source.byteLength,
      after: output.byteLength,
      rate: (source.byteLength - output.byteLength) / source.byteLength,
      compressor: compressor || 'unknown',
    })
  }

  fail(id: string, error: Error, compressor?: string): void {
    const err = CompressError.from(error, id)
    if (compressor) {
      err.compressor = compressor
    }
    this.errors.push({ success: false, id, error: err })
  }

  printItems(callback?: (message: string, item: Success | Fail) => void): void {
    // TODO: format log message
    callback?.('', null as any)
  }

  printStatistics(callback?: (message: string, statistics: Statistics) => void): void {
    const message = '' // TODO: format statistics message
    if (callback) {
      callback(message, this.getStatistics())
    }
    else {
      // eslint-disable-next-line no-console
      console.log(message)
    }
  }

  private getStatistics(): Statistics {
    const total = this.successes.length + this.errors.length
    const { before, after } = this.successes.reduce((acc, { before, after }) => {
      acc.before += before
      acc.after += after
      return acc
    }, { before: 0, after: 0 })
    const rate = (before - after) / before

    return {
      files: total,
      successes: this.successes,
      fails: this.errors,
      before,
      after,
      rate,
    }
  }
}
