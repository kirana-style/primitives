import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test"

import {
  TYPEAHEAD_RESET,
  createTypeahead,
  printable,
} from "../../packages/core/src/services/typeahead.ts"

const ROWS = ["Apple", "Apricot", "Banana", "Blueberry", "cherry"].map((label) => ({ label }))

beforeEach(() => void vi.useFakeTimers())
afterEach(() => void vi.useRealTimers())

describe("typeahead", () => {
  it("finds the first row a letter starts, whatever its case", () => {
    const typeahead = createTypeahead()
    expect(typeahead.match("b", ROWS, -1)?.label).toBe("Banana")
    typeahead.reset()
    expect(typeahead.match("C", ROWS, -1)?.label).toBe("cherry")
  })

  it("looks after the current row for a first letter, and wraps", () => {
    const typeahead = createTypeahead()
    expect(typeahead.match("a", ROWS, 0)?.label).toBe("Apricot")
    typeahead.reset()
    expect(typeahead.match("a", ROWS, 1)?.label).toBe("Apple")
  })

  it("walks the rows of a letter typed again", () => {
    const typeahead = createTypeahead()
    expect(typeahead.match("b", ROWS, -1)?.label).toBe("Banana")
    expect(typeahead.match("b", ROWS, 2)?.label).toBe("Blueberry")
    expect(typeahead.match("b", ROWS, 3)?.label).toBe("Banana")
  })

  it("stays on the current row while a longer word still names it", () => {
    const typeahead = createTypeahead()
    expect(typeahead.match("a", ROWS, -1)?.label).toBe("Apple")
    expect(typeahead.match("p", ROWS, 0)?.label).toBe("Apple")
    expect(typeahead.match("r", ROWS, 0)?.label).toBe("Apricot")
  })

  it("starts a new word after a pause", () => {
    const typeahead = createTypeahead()
    expect(typeahead.match("a", ROWS, -1)?.label).toBe("Apple")
    vi.advanceTimersByTime(TYPEAHEAD_RESET + 1)
    expect(typeahead.match("c", ROWS, 0)?.label).toBe("cherry")
  })

  it("answers nothing when no row matches", () => {
    expect(createTypeahead().match("z", ROWS, -1)).toBeUndefined()
  })

  it("takes a character, not Space or a shortcut", () => {
    const key = (init: KeyboardEventInit) => printable(new KeyboardEvent("keydown", init))
    expect(key({ key: "a" })).toBe(true)
    expect(key({ key: "é" })).toBe(true)
    expect(key({ key: " " })).toBe(false)
    expect(key({ key: "Enter" })).toBe(false)
    expect(key({ key: "a", ctrlKey: true })).toBe(false)
    expect(key({ key: "a", metaKey: true })).toBe(false)
  })
})
