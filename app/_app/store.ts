import { useSyncExternalStore } from 'react'

export function createStore<T>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()

  const get = () => state

  const set = (next: T | ((prev: T) => T)) => {
    state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
    listeners.forEach(l => l())
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }

  const use = () => useSyncExternalStore(subscribe, get, get)

  return { get, set, subscribe, use }
}
