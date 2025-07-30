export type Awaitable<T> = T | Promise<T>

export type FnAble<R, Args extends any[] = never[]> = R | ((...args: Args) => R)
