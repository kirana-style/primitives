import { describe, expect, expectTypeOf, it } from "vite-plus/test"

import { composeProps, mergeProps, stateAttributes, stateOf } from "./part.ts"
import type { PartState, StateOf } from "./part.ts"
import type { selectVocabulary } from "./select.vocabulary.ts"
import { vocabulary } from "./vocabulary.ts"

interface Heard {
  preventKiranaHandler(): void
}

/** What a handler is given: the browser's event, or a framework's own around it. */
const fired = (type: string) => ({ type, preventDefault() {} })

describe("a caller's props under a part's", () => {
  it("lets the part's attributes win, and an undefined of the part's leave the caller's", () => {
    const merged = mergeProps(
      { role: "link", id: "mine", title: "kept" },
      { role: "button", id: undefined, "data-open": "" }
    )
    expect(merged).toEqual({ role: "button", id: "mine", title: "kept", "data-open": "" })
  })

  it("hands on no attribute as `undefined`, so the element keeps its own in any order", () => {
    // A component the part is drawn as writes `data-disabled` on its root: spread after it
    // (JSX, Svelte), or laid over it (a Vue component's attributes), an `undefined` would take
    // it away though neither the part nor its caller had anything to say about it.
    const merged = mergeProps(
      { title: undefined, "data-slot": "day" },
      { "data-selected": "", "data-disabled": undefined, title: undefined }
    )
    expect(Object.keys(merged).sort()).toEqual(["data-selected", "data-slot"])
    expect("data-disabled" in mergeProps(undefined, { "data-disabled": undefined })).toBe(false)
    expect("title" in composeProps({ title: undefined }, { lang: "en" })).toBe(false)
  })

  it("joins classes, under either name, the caller's first", () => {
    expect(mergeProps({ class: "a" }, { class: "b" }).class).toBe("a b")
    expect(mergeProps({ className: "a" }, { className: "b" }).className).toBe("a b")
    expect(mergeProps({ class: "" }, { class: "b" }).class).toBe("b")
    // A class that is not text (a list, a record) is kept as its framework wrote it.
    expect(mergeProps({ class: ["a", { on: true }] }, { class: "b" }).class).toEqual([
      ["a", { on: true }],
      "b",
    ])
  })

  it("merges a style property by property, the part's winning one", () => {
    expect(
      mergeProps({ style: { color: "red", width: "1px" } }, { style: { width: "50%" } }).style
    ).toEqual({ color: "red", width: "50%" })
    expect(mergeProps({ style: "color: red;" }, { style: { width: "50%" } }).style).toBe(
      "color: red; width: 50%"
    )
  })

  it("runs the caller's handler, then the part's unless the caller stopped it", () => {
    const heard: string[] = []
    const merged = mergeProps(
      {
        onClick: (event: Event & Heard) => {
          heard.push("caller")
          if (event.type === "stop") event.preventKiranaHandler()
        },
      },
      { onClick: () => heard.push("part") }
    )
    const click = merged.onClick as (event: object) => void
    click(fired("click"))
    expect(heard).toEqual(["caller", "part"])
    click(fired("stop"))
    expect(heard).toEqual(["caller", "part", "caller"])
  })

  it("passes on what is not an event as it is", () => {
    const heard: unknown[] = []
    const merged = mergeProps(
      { onValue: (...given: unknown[]) => heard.push(given) },
      { onValue: (...given: unknown[]) => heard.push(given) }
    )
    ;(merged.onValue as (...given: unknown[]) => void)("text", 2)
    expect(heard).toEqual([
      ["text", 2],
      ["text", 2],
    ])
  })
})

describe("the element a caller asks for, between the part's caller and the part", () => {
  // What a design system's wrapper hands the part, the element its own caller asked for, and
  // the part: `<Button data-slot="button" render={<a data-slot="pagination-link" />} />`.
  const through = (
    handed: Record<string, unknown>,
    element: Record<string, unknown>,
    part: Record<string, unknown>
  ) => mergeProps(composeProps(handed, element), part)

  it("lets the element's own props win over what was handed to the part", () => {
    const merged = through(
      { "data-slot": "button", type: "button", title: "handed" },
      { "data-slot": "pagination-link", href: "#", title: undefined },
      { type: undefined, "data-disabled": "" }
    )
    expect(merged).toEqual({
      "data-slot": "pagination-link",
      type: "button",
      title: "handed",
      href: "#",
      "data-disabled": "",
    })
  })

  it("keeps the part's attributes over both", () => {
    const merged = through({ role: "a" }, { role: "b", disabled: true }, { role: "combobox" })
    expect(merged.role).toBe("combobox")
    expect(merged.disabled).toBe(true)
  })

  it("joins the classes of all three and merges their styles, the higher winning a property", () => {
    const merged = through(
      { className: "handed", style: { color: "red", width: "1px", height: "1px" } },
      { className: "element", style: { width: "2px", height: "2px" } },
      { style: { height: "3px" } }
    )
    expect(merged.className).toBe("handed element")
    expect(merged.style).toEqual({ color: "red", width: "2px", height: "3px" })
  })

  it("runs every handler, lowest first, and lets either of the first two stop the part's", () => {
    const heard: string[] = []
    const merged = through(
      {
        onClick: (event: Event & Heard) => {
          heard.push("handed")
          if (event.type === "handed") event.preventKiranaHandler()
        },
      },
      {
        onClick: (event: Event & Heard) => {
          heard.push("element")
          if (event.type === "element") event.preventKiranaHandler()
        },
      },
      { onClick: () => heard.push("part") }
    )
    const click = merged.onClick as (event: object) => void
    click(fired("click"))
    expect(heard).toEqual(["handed", "element", "part"])
    heard.length = 0
    // Stopped by the first: the element's still runs, the part's does not.
    click(fired("handed"))
    expect(heard).toEqual(["handed", "element"])
    heard.length = 0
    click(fired("element"))
    expect(heard).toEqual(["handed", "element"])
  })

  it("gives an event its preventKiranaHandler where the part has no handler for it", () => {
    const merged = composeProps(
      { onClick: (event: Event & Heard) => event.preventKiranaHandler() },
      { onClick: () => {} }
    )
    expect(() => (merged.onClick as (event: object) => void)(fired("click"))).not.toThrow()
  })

  it("gives it under a part that has no handler for the event at all", () => {
    const merged = mergeProps(
      { onKeyDown: (event: Event & Heard) => event.preventKiranaHandler() },
      { onClick: () => {} }
    )
    expect(() => (merged.onKeyDown as (event: object) => void)(fired("keydown"))).not.toThrow()
  })

  it("leaves a value a callback is given as it is", () => {
    const value = { type: "pear" }
    const merged = mergeProps({ onValueChange: () => {} }, { onValueChange: () => {} })
    ;(merged.onValueChange as (value: object) => void)(value)
    expect(Object.keys(value)).toEqual(["type"])
  })
})

describe("a part's state", () => {
  it("is read from its data attributes, camel-cased, an absent one absent", () => {
    const state = stateOf({
      role: "dialog",
      "data-open": "",
      "data-side": "bottom",
      "data-starting-style": "",
      "data-index": 2,
      "data-closed": undefined,
      "aria-expanded": "true",
      onClick() {},
    })
    expect(state).toEqual({ open: true, side: "bottom", startingStyle: true, index: "2" })
    expect("closed" in state).toBe(false)
  })

  it("is written back as the attributes it was read from", () => {
    const attributes = stateAttributes({
      open: true,
      side: "bottom",
      startingStyle: true,
      index: 2,
      closed: false,
      disabled: undefined,
      invalid: null,
    })
    expect(attributes).toEqual({
      "data-open": "",
      "data-side": "bottom",
      "data-starting-style": "",
      "data-index": "2",
    })
    expect(stateOf(attributes)).toEqual({
      open: true,
      side: "bottom",
      startingStyle: true,
      index: "2",
    })
  })

  it("has, in the vocabulary, the name its attribute reads as", () => {
    // `StateOf` names a state by its key in the definition and `stateOf` by its attribute:
    // the two are one name, for every state of every part.
    const parts = Object.values(vocabulary).flatMap(
      (component) =>
        Object.values(component) as { states?: Record<string, { attribute: string }> }[]
    )
    const states = parts.flatMap((part) => Object.entries(part.states ?? {}))
    expect(states.length).toBeGreaterThan(500)
    for (const [name, { attribute }] of states) {
      expect(Object.keys(stateOf({ [attribute]: "" }))).toEqual([name])
    }
  })

  it("is typed from a part's definition", () => {
    type Positioner = StateOf<typeof selectVocabulary.positioner>
    expectTypeOf<Positioner["open"]>().toEqualTypeOf<true | undefined>()
    expectTypeOf<Positioner["side"]>().toEqualTypeOf<
      "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end" | "none" | undefined
    >()
    expectTypeOf<Positioner["align"]>().toEqualTypeOf<"start" | "center" | "end" | undefined>()
    // A part with no state has none.
    expectTypeOf<keyof StateOf<typeof selectVocabulary.group>>().toEqualTypeOf<never>()
    // What `stateOf` returns fits any part's.
    expectTypeOf<PartState>().toMatchTypeOf<Record<string, string | true>>()
  })
})
