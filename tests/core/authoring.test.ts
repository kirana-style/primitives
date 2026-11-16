import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { createRating, ratingVocabulary } from "../../docs/examples/rating.ts"
import type { RatingProps } from "../../docs/examples/rating.ts"
import * as authoring from "../../packages/core/src/authoring.ts"
import { bind } from "../../packages/core/src/bind.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { focused, mount } from "./page.ts"

// The guide and the files it quotes, as text.
const texts = (
  import.meta as unknown as {
    glob(pattern: string[], options: object): Record<string, string>
  }
).glob(["../../docs/authoring.md", "../../docs/examples/*", "../../packages/react/examples/*"], {
  query: "?raw",
  import: "default",
  eager: true,
})
const guide = texts["../../docs/authoring.md"]!
const source = texts["../../docs/examples/rating.ts"]!
const reactSource = texts["../../packages/react/examples/rating.tsx"]!

/** A file as the guide quotes it: by the names it is published under. */
const published = (text: string) =>
  text
    .replace(/"\.\.\/\.\.\/packages\/core\/src\/index\.ts"/g, '"@kirana-ui/core"')
    .replace(/"\.\.\/\.\.\/packages\/core\/src\/authoring\.ts"/g, '"@kirana-ui/core/authoring"')
    .replace(/"\.\.\/src\/runtime\.tsx"/g, '"@kirana-ui/react/runtime"')
    .replace(/"\.\.\/\.\.\/\.\.\/docs\/examples\/rating\.ts"/g, '"./rating.ts"')
    .trimEnd()

function rating(given: Partial<RatingProps> = {}) {
  const root = mount(
    `<form id="form"><fieldset id="set"><div id="stars">${[1, 2, 3, 4, 5]
      .map((each) => `<button type="button" id="star${each}">★</button>`)
      .join("")}<input id="hidden" /></div></fieldset></form>`
  )
  const heard: string[] = []
  const made = createRating(
    signal<RatingProps>({
      name: "stars",
      onValueChange: (value, by) => void heard.push(`${value} ${by.reason} ${by.source}`),
      ...given,
    })
  )
  const find = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!
  onTestFinished(bind(find("stars"), made.root))
  for (const each of [1, 2, 3, 4, 5]) onTestFinished(bind(find(`star${each}`), made.item(each)))
  onTestFinished(bind(find("hidden"), made.input))
  onTestFinished(made.mount())
  return { made, heard, find }
}

describe("the guide to building a component", () => {
  it("quotes the files that are tested here", () => {
    expect(guide).toContain(published(source))
    expect(guide).toContain(published(reactSource))
  })

  it("names only what the authoring entry has", () => {
    for (const [, name] of guide.matchAll(/`(create[A-Z]\w+|defineComponent|state|bindable)`/g)) {
      if (name === "bindable" || name === "createRating") continue
      expect(authoring, name).toHaveProperty(name!)
    }
  })

  it("builds a rating that is a radio group, one stop for Tab", async () => {
    const { made, heard, find } = rating({ defaultValue: 2 })
    expect(find("stars").getAttribute("role")).toBe("radiogroup")
    expect(find("star2").getAttribute("aria-checked")).toBe("true")
    expect(find("star2").tabIndex).toBe(0)
    expect(find("star3").tabIndex).toBe(-1)
    expect(find("star1").hasAttribute("data-checked")).toBe(true)
    expect(find("star3").hasAttribute("data-checked")).toBe(false)
    await userEvent.click(find("star4"))
    expect(made.value.peek()).toBe(4)
    expect(find<HTMLInputElement>("hidden").value).toBe("4")
    find("star4").focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(focused()).toBe("star5")
    expect(made.value.peek()).toBe(5)
    await userEvent.keyboard("{ArrowRight}")
    expect(made.value.peek()).toBe(1)
    expect(heard).toEqual(["4 item-press mouse", "5 keyboard keyboard", "1 keyboard keyboard"])
  })

  it("writes only what its vocabulary says", () => {
    const { find } = rating({ defaultValue: 3, disabled: true })
    const known = new Set(
      Object.values(ratingVocabulary).flatMap((part) =>
        Object.values(part.states).map((each) => each.attribute)
      )
    )
    for (const element of [find("stars"), find("star1")]) {
      for (const { name } of element.attributes) {
        if (name.startsWith("data-")) expect(known.has(name), name).toBe(true)
      }
    }
  })

  it("follows its form: reset, and a disabled fieldset", async () => {
    const { made, find } = rating({ defaultValue: 2 })
    await userEvent.click(find("star5"))
    find<HTMLFormElement>("form").reset()
    expect(made.value.peek()).toBe(2)
    find<HTMLFieldSetElement>("set").disabled = true
    await expect.poll(() => find("stars").hasAttribute("data-disabled")).toBe(true)
    find("star5").click()
    expect(made.value.peek()).toBe(2)
  })

  it("stays when a caller refuses", async () => {
    const { made, find } = rating({ value: 2, onValueChange: (_value, by) => by.cancel() })
    await userEvent.click(find("star5"))
    expect(made.value.peek()).toBe(2)
  })
})
