export class CompressError extends Error {
  public id?: string
  public compressor?: string

  constructor(message: string, id: string | undefined, options?: ErrorOptions)
  constructor(message: string, options?: ErrorOptions)
  constructor(message: string, id?: string | ErrorOptions, options?: ErrorOptions) {
    if (typeof id !== 'string') {
      options = id
      id = undefined
    }

    super(message, options)

    if (id) {
      this.id = id
    }
    this.name = 'CompressError'
  }

  static from(error: unknown, id?: string): CompressError {
    if (error instanceof CompressError) {
      return error
    }
    if (error instanceof Error) {
      return new CompressError(error.message, id, { cause: error })
    }
    return new CompressError(String(error))
  }

  static is(value: unknown): value is CompressError {
    return value instanceof CompressError
  }
}
