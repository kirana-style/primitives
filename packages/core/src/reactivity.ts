/**
 * The core's own reactivity: signals, computeds and effects. Every controller is written against
 * it, so a behaviour runs the same code on every framework, and an adapter only bridges a signal
 * into its framework's updates.
 *
 * Push-pull with three states, so a computed whose inputs changed but whose value did not never
 * re-runs what reads it. Effects run synchronously when the outermost batch ends.
 */

const CLEAN = 0
const CHECK = 1
const DIRTY = 2

type Equals<T> = (a: T, b: T) => boolean

export interface ReadonlySignal<T> {
  /** The value, tracked by the computed or effect that reads it. */
  get(): T
  /** The value, untracked. */
  peek(): T
  /** Calls `listener` after each change (not at once). Returns the unsubscribe. */
  subscribe(listener: () => void): () => void
}

export interface Signal<T> extends ReadonlySignal<T> {
  set(value: T): void
}

// The graph links nodes of any value type.
// oxlint-disable-next-line typescript/no-explicit-any
type AnyNode = Node<any>

let observer: AnyNode | null = null
let collected: AnyNode[] | null = null
let collectedIndex = 0
let depth = 0
const queue: AnyNode[] = []

class Node<T> implements Signal<T> {
  value: T
  fn: (() => T) | undefined
  state: number
  sources: AnyNode[] | null = null
  observers: AnyNode[] | null = null
  isEffect = false
  cleanup: (() => void) | undefined
  equals: Equals<T>

  constructor(value: T, fn: (() => T) | undefined, equals: Equals<T>) {
    this.value = value
    this.fn = fn
    this.state = fn ? DIRTY : CLEAN
    this.equals = equals
  }

  get(): T {
    if (observer) {
      // The same sources in the same order as last time: nothing to relink.
      if (!collected && observer.sources?.[collectedIndex] === this) {
        collectedIndex++
      } else if (collected) {
        collected.push(this)
      } else {
        collected = [this]
      }
    }
    if (this.fn) this.refresh()
    return this.value
  }

  peek(): T {
    if (this.fn) this.refresh()
    return this.value
  }

  set(value: T): void {
    if (this.equals(this.value, value)) return
    this.value = value
    if (this.observers) {
      for (const each of this.observers) each.stale(DIRTY)
    }
    if (depth === 0) flush()
  }

  subscribe(listener: () => void): () => void {
    let first = true
    return effect(() => {
      this.get()
      if (first) first = false
      else untracked(listener)
    })
  }

  stale(state: number): void {
    if (this.state >= state) return
    if (this.state === CLEAN && this.isEffect) queue.push(this)
    this.state = state
    if (this.observers) {
      for (const each of this.observers) each.stale(CHECK)
    }
  }

  /** Brings a computed or an effect up to date, re-running it only if a source really changed. */
  refresh(): void {
    if (this.state === CHECK) {
      for (const source of this.sources!) {
        source.refresh()
        if ((this.state as number) === DIRTY) break
      }
    }
    if (this.state === DIRTY) this.run()
    this.state = CLEAN
  }

  run(): void {
    const previous = this.value
    const outerObserver = observer
    const outerCollected = collected
    const outerIndex = collectedIndex
    // The node that is running is the one that tracks what it reads.
    // oxlint-disable-next-line typescript/no-this-alias
    observer = this
    collected = null
    collectedIndex = 0
    try {
      if (this.cleanup) {
        const cleanup = this.cleanup
        this.cleanup = undefined
        cleanup()
      }
      this.value = this.fn!()
      this.relink()
    } finally {
      observer = outerObserver
      collected = outerCollected
      collectedIndex = outerIndex
    }
    if (!this.isEffect && this.observers && !this.equals(previous, this.value)) {
      for (const each of this.observers) each.state = DIRTY
    }
  }

  private relink(): void {
    const kept = collectedIndex
    if (collected) {
      if (this.sources) {
        for (let i = kept; i < this.sources.length; i++) unlink(this.sources[i]!, this)
        this.sources.length = kept
        for (const source of collected) this.sources.push(source)
      } else {
        this.sources = collected
      }
      for (const source of collected) {
        if (source.observers) source.observers.push(this)
        else source.observers = [this]
      }
    } else if (this.sources && kept < this.sources.length) {
      for (let i = kept; i < this.sources.length; i++) unlink(this.sources[i]!, this)
      this.sources.length = kept
    }
  }

  dispose(): void {
    if (this.sources) {
      for (const source of this.sources) unlink(source, this)
      this.sources = null
    }
    if (this.cleanup) {
      const cleanup = this.cleanup
      this.cleanup = undefined
      cleanup()
    }
    // Never runs again, even if it is already queued.
    this.fn = undefined
    this.state = CLEAN
  }
}

function unlink(source: AnyNode, target: AnyNode): void {
  const observers = source.observers
  if (!observers) return
  const index = observers.indexOf(target)
  if (index < 0) return
  const last = observers.pop()!
  if (index < observers.length) observers[index] = last
}

let flushing = false

function flush(): void {
  // An effect may write a signal: what that queues runs in this same loop, not a nested one.
  if (flushing) return
  flushing = true
  try {
    for (let i = 0; i < queue.length; i++) {
      const node = queue[i]!
      if (node.fn) node.refresh()
    }
  } finally {
    queue.length = 0
    flushing = false
  }
}

export function signal<T>(value: T, equals: Equals<T> = Object.is): Signal<T> {
  return new Node(value, undefined, equals)
}

export function computed<T>(fn: () => T, equals: Equals<T> = Object.is): ReadonlySignal<T> {
  return new Node(undefined as T, fn, equals)
}

/**
 * Runs `fn` now and again whenever a signal it read changes. `fn` may return a cleanup, called
 * before the next run and when the effect is disposed. Returns the dispose.
 */
export function effect(fn: () => void | (() => void)): () => void {
  const node = new Node<void>(undefined, undefined, Object.is)
  node.isEffect = true
  node.fn = () => {
    const cleanup = fn()
    if (typeof cleanup === "function") node.cleanup = cleanup
  }
  node.state = DIRTY
  depth++
  try {
    node.refresh()
  } finally {
    if (--depth === 0) flush()
  }
  return () => node.dispose()
}

/** Writes made inside `fn` notify once, when the outermost batch ends. */
export function batch<T>(fn: () => T): T {
  depth++
  try {
    return fn()
  } finally {
    if (--depth === 0) flush()
  }
}

/** Reads made inside `fn` are not tracked. */
export function untracked<T>(fn: () => T): T {
  const outerObserver = observer
  const outerCollected = collected
  const outerIndex = collectedIndex
  observer = null
  collected = null
  collectedIndex = 0
  try {
    return fn()
  } finally {
    observer = outerObserver
    collected = outerCollected
    collectedIndex = outerIndex
  }
}

/**
 * One boolean signal per key over a single-valued signal, so a list of thousands of rows asking
 * "am I the highlighted one?" wakes two rows when the highlight moves, not all of them.
 */
export function keyed<K>(source: ReadonlySignal<K>): {
  is(key: K): ReadonlySignal<boolean>
  dispose(): void
} {
  const rows = new Map<K, Signal<boolean>>()
  let current = source.peek()
  const stop = effect(() => {
    const next = source.get()
    if (Object.is(next, current)) return
    const before = rows.get(current)
    const after = rows.get(next)
    current = next
    untracked(() =>
      batch(() => {
        before?.set(false)
        after?.set(true)
      })
    )
  })
  return {
    is(key) {
      let row = rows.get(key)
      if (!row) {
        row = signal(Object.is(key, current))
        rows.set(key, row)
      }
      return row
    },
    dispose() {
      stop()
      rows.clear()
    },
  }
}
