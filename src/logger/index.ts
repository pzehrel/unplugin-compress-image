interface Success {
  /** file name */
  id: string
  before: number
  after: number
  /** compressor name */
  compressor: string
}
interface Fail {
  id: string
  error: Error
}

export class CompressLogger {
  logs: (Success | Fail)[] = []

  push(...log: (Success | Fail)[]): void {
    this.logs.push(...log)
  }

  table(): void {
    const list = this.logs.map((item) => {
      return {
        id: item.id,
        before: 'before' in item ? item.before : '-',
        after: 'after' in item ? item.after : '-',
        compressor: 'compressor' in item ? item.compressor : '-',
        state: 'error' in item ? `fail: ${item.error.message}` : 'success',
      }
    })

    // eslint-disable-next-line no-console
    console.table(list)
  }

  log(...item: (Success | Fail)[]): void {
    this.push(...item)
    console.log(item)
  }
}
