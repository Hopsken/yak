// @ts-nocheck

export function singletonSync<T>(fn: () => T, key: string): T {
  if (globalThis[key]) {
    return globalThis[key]
  }

  const instance = fn()
  globalThis[key] = instance
  return instance
}
