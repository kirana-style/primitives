import { describe, expect, it } from "vite-plus/test"

import { bindable } from "./bindable.ts"
import { details } from "./part.ts"
import { batch, computed, effect, keyed, signal, untracked } from "./reactivity.ts"

describe("signals", () => {
  it("runs an effect at once and on each change", () => {
    const count = signal(0)
    const seen: number[] = []
    const stop = effect(() => void seen.push(count.get()))
    count.set(1)
    count.set(1)
    count.set(2)
    stop()
    count.set(3)
    expect(seen).toEqual([0, 1, 2])
  })

  it("does not re-run what reads a computed whose value did not change", () => {
    const count = signal(1)
    const parity = computed(() => count.get() % 2)
    let runs = 0
    effect(() => {
      parity.get()
      runs++
    })
    count.set(3)
    count.set(5)
    expect(runs).toBe(1)
    count.set(6)
    expect(runs).toBe(2)
  })

  it("is glitch-free across a diamond", () => {
    const a = signal(1)
    const b = computed(() => a.get() * 2)
    const c = computed(() => a.get() * 3)
    const seen: number[] = []
    effect(() => void seen.push(b.get() + c.get()))
    a.set(2)
    expect(seen).toEqual([5, 10])
  })

  it("batches writes into one notification", () => {
    const a = signal(1)
    const b = signal(1)
    let runs = 0
    effect(() => {
      a.get()
      b.get()
      runs++
    })
    batch(() => {
      a.set(2)
      b.set(2)
    })
    expect(runs).toBe(2)
  })

  it("drops a source an effect no longer reads", () => {
    const which = signal(true)
    const a = signal("a")
    const b = signal("b")
    const seen: string[] = []
    effect(() => void seen.push(which.get() ? a.get() : b.get()))
    which.set(false)
    a.set("a2")
    b.set("b2")
    expect(seen).toEqual(["a", "b", "b2"])
  })

  it("runs an effect's cleanup before its next run and on dispose", () => {
    const count = signal(0)
    const log: string[] = []
    const stop = effect(() => {
      const now = count.get()
      return () => void log.push(`clean ${now}`)
    })
    count.set(1)
    stop()
    expect(log).toEqual(["clean 0", "clean 1"])
  })

  it("lets an effect write a signal another effect reads", () => {
    const source = signal(1)
    const mirror = signal(0)
    const seen: number[] = []
    effect(() => mirror.set(source.get() * 10))
    effect(() => void seen.push(mirror.get()))
    source.set(2)
    expect(seen).toEqual([10, 20])
  })

  it("does not track untracked reads, and subscribe skips the first value", () => {
    const a = signal(1)
    let runs = 0
    effect(() => {
      untracked(() => a.get())
      runs++
    })
    let heard = 0
    const stop = a.subscribe(() => heard++)
    a.set(2)
    stop()
    a.set(3)
    expect(runs).toBe(1)
    expect(heard).toBe(1)
  })

  it("wakes only the two keys a keyed signal moves between", () => {
    const current = signal("a")
    const rows = keyed(current)
    const runs = { a: 0, b: 0, c: 0 }
    for (const key of ["a", "b", "c"] as const) {
      const is = rows.is(key)
      effect(() => {
        is.get()
        runs[key]++
      })
    }
    current.set("b")
    expect(runs).toEqual({ a: 2, b: 2, c: 1 })
    expect(rows.is("b").peek()).toBe(true)
  })
})

describe("bindable", () => {
  it("is its own value until the caller gives one, and reads its default once", () => {
    const props = signal<{ value?: boolean; fallback: boolean }>({ fallback: true })
    const heard: boolean[] = []
    const open = bindable({
      value: () => props.get().value,
      defaultValue: props.peek().fallback,
      onChange: (next) => void heard.push(next),
    })
    expect(open.peek()).toBe(true)
    props.set({ fallback: false })
    expect(open.peek()).toBe(true)
    open.set(false, details("test"))
    expect(open.peek()).toBe(false)
    props.set({ value: true, fallback: false })
    expect(open.peek()).toBe(true)
    open.set(false, details("test"))
    expect(open.peek()).toBe(true)
    expect(heard).toEqual([false, false])
  })

  it("keeps its value when the change is cancelled", () => {
    const open = bindable({
      value: () => undefined,
      defaultValue: false,
      onChange: (_next, by) => by.cancel(),
    })
    open.set(true, details("test"))
    expect(open.peek()).toBe(false)
  })
})
