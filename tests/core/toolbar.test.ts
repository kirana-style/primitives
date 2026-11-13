import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createToggleGroup } from "../../packages/core/src/toggle-group.ts"
import type { ToggleGroupProps } from "../../packages/core/src/toggle-group.ts"
import { createToggle } from "../../packages/core/src/toggle.ts"
import { createToolbar } from "../../packages/core/src/toolbar.ts"
import type { ToolbarProps } from "../../packages/core/src/toolbar.ts"
import { find, focused, mount } from "./page.ts"

const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
const on = (root: HTMLElement) =>
  [...root.querySelectorAll('[aria-pressed="true"]')].map((each) => each.id)

const GROUP = `
  <button id="before">Before</button>
  <div id="group">
    <button id="bold">Bold</button>
    <button id="italic">Italic</button>
    <button id="off">Off</button>
    <button id="under">Underline</button>
  </div>
  <button id="after">After</button>`

function group(given: Partial<ToggleGroupProps<string>> = {}, dir?: "rtl") {
  const root = mount(GROUP)
  if (dir) root.setAttribute("dir", dir)
  const heard: string[][] = []
  const pressed: string[] = []
  const made = createToggleGroup(
    signal<ToggleGroupProps<string>>({ onValueChange: (next) => void heard.push(next), ...given })
  )
  onTestFinished(bind(find(root, "group"), made.root))
  for (const id of ["bold", "italic", "off", "under"]) {
    const toggle = createToggle(
      signal({
        value: id,
        disabled: id === "off",
        onPressedChange: (next: boolean) => void pressed.push(`${id}:${next}`),
      }),
      { group: made }
    )
    onTestFinished(bind(find(root, id), toggle.root))
  }
  return { root, made, heard, pressed }
}

describe("a toggle group", () => {
  it("is one stop for Tab, and the arrows move between its toggles", async () => {
    const { root } = group()
    expect(find(root, "group").getAttribute("role")).toBe("group")
    find(root, "before").focus()
    await press("Tab")
    expect(focused()).toBe("bold")
    expect(find(root, "italic").getAttribute("tabindex")).toBe("-1")
    await press("ArrowRight")
    expect(focused()).toBe("italic")
    await press("ArrowRight")
    // Past the disabled one, and round.
    expect(focused()).toBe("under")
    await press("ArrowRight")
    expect(focused()).toBe("bold")
    await press("End")
    expect(focused()).toBe("under")
    await press("Tab")
    expect(focused()).toBe("after")
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}")
    // Back in at the toggle focus was last on.
    expect(focused()).toBe("under")
  })

  it("holds one pressed toggle, or none", async () => {
    const { root, heard, pressed } = group({ defaultValue: ["bold"] })
    expect(on(root)).toEqual(["bold"])
    find(root, "italic").click()
    expect(on(root)).toEqual(["italic"])
    find(root, "italic").click()
    expect(on(root)).toEqual([])
    find(root, "off").click()
    expect(heard).toEqual([["italic"], []])
    // A toggle's own caller hears its own press.
    expect(pressed).toEqual(["italic:true", "italic:false"])
    expect(find(root, "italic").hasAttribute("data-pressed")).toBe(false)
  })

  it("holds several when it is told to", () => {
    const { root, made } = group({ multiple: true })
    find(root, "bold").click()
    find(root, "under").click()
    find(root, "bold").click()
    find(root, "italic").click()
    expect(made.value.peek()).toEqual(["under", "italic"])
    expect(find(root, "group").hasAttribute("data-multiple")).toBe(true)
  })

  it("follows the reading direction, and a column goes down", async () => {
    const rtl = group({}, "rtl")
    find(rtl.root, "bold").focus()
    await press("ArrowLeft")
    expect(focused()).toBe("italic")
    const column = group({ orientation: "vertical" })
    find(column.root, "bold").focus()
    await press("ArrowRight")
    expect(focused()).toBe("bold")
    await press("ArrowDown")
    expect(focused()).toBe("italic")
  })

  it("a caller who refuses keeps the value, and the toggle's caller is not told", () => {
    const { root, pressed } = group({ onValueChange: (_next, by) => by.cancel() })
    find(root, "bold").click()
    expect(on(root)).toEqual([])
    expect(pressed).toEqual([])
  })
})

const BAR = `
  <button id="before">Before</button>
  <div id="bar">
    <button id="save">Save</button>
    <button id="gone" disabled>Gone</button>
    <a id="link" href="#x">Link</a>
    <input id="zoom" value="100" />
    <div id="marks"><button id="b">B</button><button id="i">I</button></div>
    <button id="alone">Pin</button>
    <div id="line"></div>
  </div>
  <button id="after">After</button>`

function toolbar(given: ToolbarProps = {}) {
  const root = mount(BAR)
  const made = createToolbar(signal(given))
  onTestFinished(bind(find(root, "bar"), made.root))
  onTestFinished(bind(find(root, "save"), made.button()))
  onTestFinished(
    bind(
      find(root, "gone"),
      made.button(() => ({ disabled: true }))
    )
  )
  onTestFinished(bind(find(root, "link"), made.link()))
  onTestFinished(bind(find(root, "zoom"), made.input()))
  onTestFinished(bind(find(root, "line"), made.separator))
  // A toggle group inside it: the stop and the arrows are the toolbar's.
  const marks = createToggleGroup(signal<ToggleGroupProps<string>>({ multiple: true }), {
    toolbar: made,
  })
  onTestFinished(bind(find(root, "marks"), marks.root))
  for (const id of ["b", "i"]) {
    onTestFinished(bind(find(root, id), createToggle(signal({ value: id }), { group: marks }).root))
  }
  // And a toggle of its own.
  onTestFinished(bind(find(root, "alone"), createToggle(signal({}), { toolbar: made }).root))
  return { root, made, marks }
}

describe("a toolbar", () => {
  it("is one stop for Tab over buttons, links, inputs and toggles alike", async () => {
    const { root } = toolbar()
    const bar = find(root, "bar")
    expect(bar.getAttribute("role")).toBe("toolbar")
    expect(bar.getAttribute("aria-orientation")).toBe("horizontal")
    find(root, "before").focus()
    await press("Tab")
    expect(focused()).toBe("save")
    await press("ArrowRight")
    // Past the disabled button.
    expect(focused()).toBe("link")
    await press("ArrowRight")
    expect(focused()).toBe("zoom")
    await press("Tab")
    expect(focused()).toBe("after")
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}")
    expect(focused()).toBe("zoom")
    expect(find(root, "line").getAttribute("aria-orientation")).toBe("vertical")
  })

  it("an input keeps its arrows until the caret is at an end", async () => {
    const { root } = toolbar()
    const zoom = find<HTMLInputElement>(root, "zoom")
    zoom.focus()
    zoom.setSelectionRange(1, 1)
    await press("ArrowRight")
    expect(focused()).toBe("zoom")
    expect(zoom.selectionStart).toBe(2)
    zoom.setSelectionRange(3, 3)
    await press("ArrowRight")
    expect(focused()).toBe("b")
    await press("ArrowLeft")
    expect(focused()).toBe("zoom")
    zoom.setSelectionRange(0, 0)
    await press("ArrowLeft")
    expect(focused()).toBe("link")
  })

  it("carries a toggle group and a toggle as its own items", async () => {
    const { root, marks } = toolbar()
    find(root, "b").focus()
    await press("ArrowRight")
    expect(focused()).toBe("i")
    await press("ArrowRight")
    // Out of the group, on to the next item: one row of stops.
    expect(focused()).toBe("alone")
    await press("ArrowRight")
    expect(focused()).toBe("save")
    await press(" ")
    find(root, "b").click()
    find(root, "alone").click()
    expect(marks.value.peek()).toEqual(["b"])
    expect(find(root, "alone").getAttribute("aria-pressed")).toBe("true")
    expect(find(root, "i").getAttribute("tabindex")).toBe("-1")
  })

  it("disabled, so is everything in it", () => {
    const { root } = toolbar({ disabled: true })
    expect(find<HTMLButtonElement>(root, "save").disabled).toBe(true)
    expect(find<HTMLButtonElement>(root, "b").disabled).toBe(true)
    expect(find<HTMLButtonElement>(root, "alone").disabled).toBe(true)
  })
})
