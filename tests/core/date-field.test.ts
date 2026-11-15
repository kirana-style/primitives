import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createDateField } from "../../packages/core/src/date-field.ts"
import type { DateFieldProps } from "../../packages/core/src/date-field.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { find, mount } from "./page.ts"

/** Draws a field with no framework: a span for each piece, its text as it changes. */
function field(given: Partial<DateFieldProps> = {}, dir?: "rtl") {
  const root = mount(
    `<form id="form"><div id="group"></div><input id="hidden" /><button id="after" type="button">After</button></form>`
  )
  if (dir) root.setAttribute("dir", dir)
  const heard: [string | null, string][] = []
  const props = signal<DateFieldProps>({
    id: "df",
    locale: "en-US",
    name: "born",
    onValueChange: (value, details) => void heard.push([value, details.reason]),
    ...given,
  })
  const made = createDateField(props)
  const group = find(root, "group")
  onTestFinished(bind(group, made.root))
  onTestFinished(bind(find(root, "hidden"), made.input))
  onTestFinished(made.mount())
  for (const segment of made.segments.peek()) {
    const span = document.createElement("span")
    span.dataset.unit = segment.type
    group.append(span)
    const { part, text } = made.segment(segment)
    onTestFinished(bind(span, part))
    onTestFinished(effect(() => void (span.textContent = text.get())))
  }
  const part = (unit: string) => group.querySelector<HTMLElement>(`[data-unit="${unit}"]`)!
  const shown = () => group.textContent
  const at = () => (document.activeElement as HTMLElement | null)?.dataset.unit
  const hidden = find<HTMLInputElement>(root, "hidden")
  return { root, group, props, made, heard, part, shown, at, hidden }
}

const type = (keys: string) => userEvent.keyboard(keys)

describe("a date that is typed", () => {
  it("is a group of spin buttons in the order the locale writes a date", () => {
    const { group, part, shown } = field()
    expect(group.getAttribute("role")).toBe("group")
    expect(shown()).toBe("mm/dd/yyyy")
    expect(part("month").getAttribute("role")).toBe("spinbutton")
    expect(part("month").getAttribute("aria-label")).toBe("month")
    expect(part("month").getAttribute("inputmode")).toBe("numeric")
    expect(part("month").hasAttribute("data-placeholder")).toBe(true)
    expect(part("literal").getAttribute("aria-hidden")).toBe("true")
    expect(field({ locale: "en-GB" }).shown()).toBe("dd/mm/yyyy")
    expect(field({ locale: "de-DE" }).shown()).toBe("dd.mm.yyyy")
    expect(field({ locale: "ja-JP" }).shown()).toBe("yyyy/mm/dd")
    expect(field({ locale: "fr-FR" }).part("month").getAttribute("aria-label")).toBe("mois")
  })

  it("fills each part from its digits and goes on to the next", async () => {
    const { part, shown, at, heard, made, hidden } = field()
    part("month").focus()
    await type("1")
    // One digit that could be the first of two waits; it shows as it stands.
    expect(shown()).toBe("01/dd/yyyy")
    expect(at()).toBe("month")
    await type("2")
    expect(shown()).toBe("12/dd/yyyy")
    expect(at()).toBe("day")
    await type("4")
    // Nothing can follow a four in a day: it is whole.
    expect(at()).toBe("year")
    expect(heard).toEqual([])
    await type("2026")
    expect(shown()).toBe("12/04/2026")
    expect(made.value.peek()).toBe("2026-12-04")
    // Said once, when the last part is whole: not for each digit of the year.
    expect(heard).toEqual([["2026-12-04", "typed"]])
    expect(hidden.value).toBe("2026-12-04")
    expect(hidden.name).toBe("born")
  })

  it("takes a zero before a digit, and no day or month past its most", async () => {
    const { part, shown, at } = field()
    part("month").focus()
    await type("07")
    expect(at()).toBe("day")
    await type("09")
    expect(shown()).toBe("07/09/yyyy")
    part("month").focus()
    await type("00")
    expect(shown()).toBe("07/09/yyyy")
    part("day").focus()
    await type("39")
    // The three stands, the nine begins again.
    expect(part("day").textContent).toBe("09")
  })

  it("turns a part with the arrows, round its ends", async () => {
    const { part, shown, heard } = field({ defaultValue: "2026-01-31" })
    expect(shown()).toBe("01/31/2026")
    part("day").focus()
    await type("{ArrowUp}")
    expect(shown()).toBe("01/01/2026")
    await type("{ArrowDown}")
    expect(shown()).toBe("01/31/2026")
    part("month").focus()
    await type("{ArrowDown}")
    expect(part("month").textContent).toBe("12")
    part("year").focus()
    await type("{ArrowUp}{PageUp}")
    expect(part("year").textContent).toBe("2037")
    expect(heard.at(-1)).toEqual(["2037-12-31", "step"])
    expect(part("day").getAttribute("aria-valuemax")).toBe("31")
  })

  it("makes a day its month does not have that month's last", async () => {
    const { part, made, shown } = field({ defaultValue: "2026-01-31" })
    part("month").focus()
    await type("{ArrowUp}")
    expect(made.value.peek()).toBe("2026-02-28")
    expect(shown()).toBe("02/28/2026")
    part("year").focus()
    await type("2028")
    part("day").focus()
    await type("{ArrowUp}")
    expect(made.value.peek()).toBe("2028-02-29")
  })

  it("starts from this year, and from a part's first or last, when it is empty", async () => {
    const { part } = field()
    part("year").focus()
    await type("{ArrowUp}")
    expect(part("year").textContent).toBe(String(new Date().getFullYear()))
    part("day").focus()
    await type("{ArrowDown}")
    expect(part("day").textContent).toBe("31")
  })

  it("moves between its parts the way the text reads, and is left by Tab", async () => {
    const { part, at } = field()
    part("month").focus()
    await type("{ArrowRight}")
    expect(at()).toBe("day")
    await type("{ArrowRight}{ArrowRight}")
    expect(at()).toBe("year")
    await type("{ArrowLeft}")
    expect(at()).toBe("day")
    await type("{Tab}{Tab}")
    expect(document.activeElement?.id).toBe("after")
    const hebrew = field({ locale: "he-IL" }, "rtl")
    hebrew.part("day").focus()
    await type("{ArrowLeft}")
    expect(hebrew.at()).toBe("month")
  })

  it("empties a part with Backspace, a digit at a time, then goes back a part", async () => {
    const { part, shown, at, made, heard } = field({ defaultValue: "2026-03-15" })
    part("day").focus()
    await type("{Backspace}")
    expect(shown()).toBe("03/dd/2026")
    expect(made.value.peek()).toBe(null)
    expect(heard).toEqual([[null, "cleared"]])
    await type("{Backspace}")
    expect(at()).toBe("month")
    await type("1")
    expect(part("month").textContent).toBe("01")
    await type("{Backspace}")
    expect(part("month").textContent).toBe("mm")
  })

  it("keeps what is half typed when focus leaves, and says a part left half typed", async () => {
    const { part, shown, heard, root } = field({ defaultValue: "2026-03-15" })
    part("month").focus()
    await type("1")
    find(root, "after").focus()
    expect(shown()).toBe("01/15/2026")
    expect(heard).toEqual([["2026-01-15", "typed"]])
  })

  it("follows a caller who holds its value, and asks before it changes", async () => {
    const held = field({ value: "2026-03-15" })
    held.part("day").focus()
    await type("{ArrowUp}")
    expect(held.heard).toEqual([["2026-03-16", "step"]])
    expect(held.made.value.peek()).toBe("2026-03-15")
    held.props.set({ ...held.props.peek(), value: "2027-01-02" })
    expect(held.shown()).toBe("01/02/2027")
    const refused = field({
      defaultValue: "2026-03-15",
      onValueChange: (_, details) => details.cancel(),
    })
    refused.part("day").focus()
    await type("{ArrowUp}")
    expect(refused.shown()).toBe("03/15/2026")
  })

  it("says when its date is outside what it takes", async () => {
    const { group, part } = field({
      defaultValue: "2026-03-15",
      min: "2026-03-10",
      max: "2026-03-20",
    })
    expect(group.hasAttribute("data-invalid")).toBe(false)
    part("day").focus()
    await type("25")
    expect(group.hasAttribute("data-invalid")).toBe(true)
    expect(part("day").getAttribute("aria-invalid")).toBe("true")
  })

  it("takes nothing while it is read-only or disabled, and no stop when disabled", async () => {
    const readOnly = field({ defaultValue: "2026-03-15", readOnly: true })
    readOnly.part("day").focus()
    await type("{ArrowUp}9")
    expect(readOnly.shown()).toBe("03/15/2026")
    expect(readOnly.part("day").hasAttribute("contenteditable")).toBe(false)
    const disabled = field({ defaultValue: "2026-03-15", disabled: true })
    expect(disabled.part("day").hasAttribute("tabindex")).toBe(false)
    expect(disabled.hidden.disabled).toBe(true)
  })

  it("is submitted with its form, goes back on reset, and is emptied by `clear`", async () => {
    const { root, part, made, hidden, shown } = field({ defaultValue: "2026-03-15" })
    const form = find<HTMLFormElement>(root, "form")
    expect(new FormData(form).get("born")).toBe("2026-03-15")
    part("day").focus()
    await type("{ArrowUp}")
    expect(hidden.value).toBe("2026-03-16")
    form.reset()
    expect(made.value.peek()).toBe("2026-03-15")
    expect(shown()).toBe("03/15/2026")
    made.clear()
    expect(shown()).toBe("mm/dd/yyyy")
    expect(made.value.peek()).toBe(null)
  })

  it("lets nothing the browser would write into a part stay there", async () => {
    const { part, shown } = field()
    part("month").focus()
    await type("ab1c2")
    expect(shown()).toBe("12/dd/yyyy")
    expect(part("month").childNodes.length).toBe(1)
  })
})
