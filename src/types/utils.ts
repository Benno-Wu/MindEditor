export type zero2nine = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type nOne2one = -1 | 0 | 1

export type tuple2union<T extends string[]> = T[number]

export type UnPartial<T> = { [k in keyof T]-?: T[k] }
export type UnPartialByKeys<T, K extends keyof T> = Pick<T & { [k in K]-?: T[k] }, keyof T>

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#readonly-mapped-type-modifiers-and-readonly-arrays
export type writable<T> = {
    -readonly [K in keyof T]: T[K];
}

// https://github.com/type-challenges/type-challenges/issues/2583
type helper<T extends any[], U extends number> =
    [...T, '']['length'] extends U ? T['length']
    : helper<[...T, ''], U>
export type MinusOne<T extends number> = helper<[], T>

// https://github.com/type-challenges/type-challenges/issues/614
export type Permutation<T, L extends number, K = T> =
    [T] extends [never] ? []
    : L extends 0 ? []
    : K extends K ? [K, ...Permutation<Exclude<T, K>, MinusOne<L>>]
    : never;

export type trimEnd<S extends string> = S extends `${infer R} ` ? trimEnd<R> : S

// @ts-ignore
export type array2string<T extends string[], PH = ' '> = T extends [infer S, ...infer R] ? `${S}${PH}${array2string<R>}` : ''
