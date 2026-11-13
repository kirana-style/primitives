import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { LONG_PRESS, PRESS_HOLD, SUBMENU_DELAY, createMenu } from "../../packages/core/src/menu.ts"
import type { Menu, MenuAround, MenuItemOptions, MenuProps } from "../../packages/core/src/menu.ts"
import { details } from "../../packages/core/src/part.ts"
import type { Part } from "../../packages/core/src/part.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { createMenubar } from "../../packages/core/src/menubar.ts"
import { SAFE_AREA_REST, createSafeArea } from "../../packages/core/src/services/safe-area.ts"
import { find, focused, mount, style } from "./page.ts"

interface Drawn {
  made: Menu
  reasons: string[]
  popup(): HTMLElement | null
}

/** What a menu's popup holds, drawn when the popup is. */
type Content = (add: (id: string, part: Part, text?: string, tag?: string) => HTMLElement) => void

/**
 * A menu drawn as an adapter draws one, in plain DOM: its trigger is in the page, its popup
 * while `mounted`, at the end of the page as a portal puts it.
 */
function menu(
  root: HTMLElement,
  trigger: HTMLElement,
  id: string,
  content: (made: Menu) => Content,
  given: Partial<MenuProps> = {},
  around: MenuAround = {}
): Drawn {
  const reasons: string[] = []
  const props = signal<MenuProps>({
    id,
    onOpenChange: (_open, by) => void reasons.push(by.reason),
    ...given,
  })
  const made = createMenu(props, around)
  const stops: (() => void)[] = [bind(trigger, around.context ? made.area : made.trigger)]
  let positioner: HTMLElement | undefined
  let undo: (() => void)[] = []
  const draw = () => {
    positioner = document.createElement("div")
    const popup = document.createElement("div")
    popup.className = "menu"
    positioner.append(popup)
    content(made)((itemId, part, text = itemId, tag = "div") => {
      const element = document.createElement(tag)
      element.id = itemId
      element.textContent = text
      popup.append(element)
      undo.push(bind(element, part))
      return element
    })
    root.append(positioner)
    undo.push(bind(positioner, made.positioner), bind(popup, made.popup))
  }
  stops.push(
    effect(() => {
      const mounted = made.mounted.get()
      untracked(() => {
        if (mounted && !positioner) draw()
        else if (!mounted && positioner) {
          for (const each of undo.reverse()) each()
          undo = []
          positioner.remove()
          positioner = undefined
        }
      })
    }),
    made.mount()
  )
  onTestFinished(() => {
    for (const each of undo.reverse()) each()
    for (const stop of stops.reverse()) stop()
    positioner?.remove()
  })
  return { made, reasons, popup: () => root.querySelector<HTMLElement>(`#${id}-popup`) }
}

const PAGE = `<button id="before">Before</button><button id="m-trigger">File</button>`

/** New, Open (disabled), Print, Save with a shortcut. */
function file(root: HTMLElement, given: Partial<MenuProps> = {}, options: MenuItemOptions = {}) {
  const pressed: string[] = []
  const drawn = menu(
    root,
    find(root, "m-trigger"),
    "m",
    (made) => (add) => {
      for (const [id, text, off] of [
        ["new", "New", false],
        ["off", "Open", true],
        ["print", "Print", false],
        ["save", "Save", false],
      ] as const) {
        const element = add(
          id,
          made.item(() => ({ ...options, disabled: off })),
          text
        )
        element.addEventListener("click", () => pressed.push(id))
        if (id === "save") {
          element.insertAdjacentHTML("beforeend", `<kbd aria-hidden="true">⌘P</kbd>`)
        }
      }
    },
    given
  )
  return { ...drawn, pressed }
}

const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
/** After the microtask in which a menu moves focus to where it was opened for. */
const settled = () => new Promise((resolve) => setTimeout(resolve))
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("a menu", () => {
  it("opens on its first item from the keyboard, and on itself from a pointer", async () => {
    const root = mount(PAGE)
    const { popup, reasons } = file(root)
    const trigger = find(root, "m-trigger")
    trigger.focus()
    await press("Enter")
    await settled()
    expect(focused()).toBe("new")
    expect(find(root, "new").hasAttribute("data-highlighted")).toBe(true)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(trigger.getAttribute("aria-controls")).toBe("m-popup")
    expect(popup()!.getAttribute("aria-labelledby")).toBe(trigger.id)
    await press("Escape")
    expect(focused()).toBe("m-trigger")

    await userEvent.click(trigger)
    await settled()
    expect(focused()).toBe("m-popup")
    expect(root.querySelector("[data-highlighted]")).toBe(null)
    await userEvent.click(trigger)

    await press("ArrowUp")
    await settled()
    expect(focused()).toBe("save")
    expect(reasons).toEqual([
      "trigger-press",
      "escape-key",
      "trigger-press",
      "trigger-press",
      "trigger-press",
    ])
  })

  it("moves round its items, past the disabled, and by typing a name", async () => {
    const root = mount(PAGE)
    file(root)
    find(root, "m-trigger").focus()
    await press("ArrowDown")
    await settled()
    await press("ArrowDown")
    expect(focused()).toBe("print")
    await press("ArrowDown")
    await press("ArrowDown")
    expect(focused()).toBe("new")
    await press("ArrowUp")
    expect(focused()).toBe("save")
    await press("p")
    expect(focused()).toBe("print")
    await press("End")
    // The shortcut beside Save is not its name: "⌘" and "P" find nothing there.
    expect(focused()).toBe("save")
    expect(find(root, "off").getAttribute("aria-disabled")).toBe("true")
  })

  it("does not go round when it is told not to", async () => {
    const root = mount(PAGE)
    file(root, { loop: false })
    find(root, "m-trigger").focus()
    await press("ArrowUp")
    await settled()
    await press("ArrowDown")
    expect(focused()).toBe("save")
  })

  it("an item's press is a click its caller hears, closes the menu and gives focus back", async () => {
    const root = mount(PAGE)
    const { pressed, reasons, popup } = file(root)
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    await press("ArrowDown")
    await press("Enter")
    expect(pressed).toEqual(["print"])
    expect(reasons).toEqual(["trigger-press", "item-press"])
    expect(focused()).toBe("m-trigger")
    await expect.poll(popup).toBe(null)
  })

  it("stays open for an item that says so, and a disabled item does nothing", async () => {
    const root = mount(PAGE)
    const { made } = file(root, {}, { closeOnClick: false })
    await userEvent.click(find(root, "m-trigger"))
    await settled()
    find(root, "new").click()
    find(root, "off").click()
    expect(made.open.peek()).toBe(true)
  })

  it("follows the pointer, and leaves the keys working when it is on no item", async () => {
    const root = mount(PAGE)
    file(root)
    await userEvent.click(find(root, "m-trigger"))
    await settled()
    await userEvent.hover(find(root, "print"))
    expect(focused()).toBe("print")
    await userEvent.hover(find(root, "off"))
    // A disabled item takes nothing, and the one the pointer left gives the menu its focus.
    expect(focused()).toBe("m-popup")
    expect(root.querySelector("[data-highlighted]")).toBe(null)
    await press("ArrowDown")
    expect(focused()).toBe("new")
  })

  it("Tab leaves it: the menu closes and its trigger has focus", async () => {
    const root = mount(PAGE)
    const { reasons } = file(root)
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    await press("Tab")
    expect(reasons).toEqual(["trigger-press", "focus-out"])
    expect(focused()).toBe("m-trigger")
  })

  it("opening it does not move the page", async () => {
    const root = mount(
      `<div style="height: 3000px"></div>${PAGE}<div style="height: 3000px"></div>`
    )
    file(root)
    const trigger = find(root, "m-trigger")
    trigger.scrollIntoView({ block: "start" })
    const before = window.scrollY
    expect(before).toBeGreaterThan(1000)
    trigger.focus({ preventScroll: true })
    await press("Enter")
    await settled()
    await wait(50)
    expect(focused()).toBe("new")
    expect(window.scrollY).toBe(before)
    await press("End")
    expect(window.scrollY).toBe(before)
  })

  it("does not open while it is disabled", async () => {
    const root = mount(PAGE)
    const { made } = file(root, { disabled: true })
    expect(find<HTMLButtonElement>(root, "m-trigger").disabled).toBe(true)
    find(root, "m-trigger").focus()
    await press("ArrowDown")
    expect(made.open.peek()).toBe(false)
  })
})

describe("a menu's checkbox and radio items", () => {
  function view(root: HTMLElement) {
    const heard: unknown[] = []
    const groups: { radio?: ReturnType<Menu["radioGroup"]> } = {}
    const drawn = menu(root, find(root, "m-trigger"), "m", (made) => (add) => {
      const wrap = made.checkboxItem(
        signal({ defaultChecked: true, onCheckedChange: (next: boolean) => void heard.push(next) })
      )
      add("wrap", wrap.part, "Word wrap")
      const held = made.checkboxItem(
        signal({ checked: false, onCheckedChange: (next: boolean) => void heard.push(next) })
      )
      add("held", held.part, "Held by the caller")
      const closing = made.checkboxItem(signal({ closeOnClick: true }))
      add("closing", closing.part, "Closes")
      const radio = (groups.radio ??= made.radioGroup(
        signal({
          defaultValue: "list",
          onValueChange: (next: unknown) => void heard.push(next),
        })
      ))
      add("list", radio.item("list"), "List")
      add("grid", radio.item("grid"), "Grid")
      add(
        "off",
        radio.item("off", () => ({ disabled: true })),
        "Off"
      )
    })
    return { ...drawn, heard, groups }
  }

  it("a checkbox item starts as its default says, toggles, and leaves the menu open", async () => {
    const root = mount(PAGE)
    const { made, heard } = view(root)
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    const wrap = find(root, "wrap")
    expect(wrap.getAttribute("role")).toBe("menuitemcheckbox")
    expect(wrap.getAttribute("aria-checked")).toBe("true")
    expect(wrap.hasAttribute("data-checked")).toBe(true)
    await press("Enter")
    expect(wrap.getAttribute("aria-checked")).toBe("false")
    expect(wrap.hasAttribute("data-unchecked")).toBe(true)
    expect(wrap.hasAttribute("data-checked")).toBe(false)
    await press(" ")
    expect(wrap.getAttribute("aria-checked")).toBe("true")
    expect(made.open.peek()).toBe(true)
    // One the caller holds asks, and stays as the caller has it.
    find(root, "held").click()
    expect(find(root, "held").getAttribute("aria-checked")).toBe("false")
    expect(heard).toEqual([false, true, true])
    find(root, "closing").click()
    expect(made.open.peek()).toBe(false)
  })

  it("a radio item is chosen, one at a time, and leaves the menu open", async () => {
    const root = mount(PAGE)
    const { made, heard, groups } = view(root)
    await userEvent.click(find(root, "m-trigger"))
    await settled()
    const list = find(root, "list")
    const grid = find(root, "grid")
    expect(list.getAttribute("role")).toBe("menuitemradio")
    expect(list.getAttribute("aria-checked")).toBe("true")
    grid.click()
    expect(list.getAttribute("aria-checked")).toBe("false")
    expect(grid.getAttribute("aria-checked")).toBe("true")
    expect(grid.hasAttribute("data-checked")).toBe(true)
    find(root, "off").click()
    expect(groups.radio!.value.peek()).toBe("grid")
    expect(heard).toEqual(["grid"])
    expect(made.open.peek()).toBe(true)
  })
})

describe("a menu's groups", () => {
  it("a label names its group, and is valid with no group around it", async () => {
    const root = mount(PAGE)
    menu(root, find(root, "m-trigger"), "m", (made) => (add) => {
      // Alone: nothing to name, and nothing thrown.
      add("lone", made.label, "Account")
      const group = made.group("g")
      add("g", group.root, "")
      add("named", group.label, "Team")
      const bare = made.group("b")
      add("b", bare.root, "")
      add("line", made.separator, "")
    })
    await userEvent.click(find(root, "m-trigger"))
    await settled()
    expect(find(root, "lone").getAttribute("role")).toBe("presentation")
    expect(find(root, "g").getAttribute("role")).toBe("group")
    expect(find(root, "g").getAttribute("aria-labelledby")).toBe("g-label")
    expect(root.querySelector("#g-label")?.textContent).toBe("Team")
    // A group with no label names nothing that is not there.
    expect(find(root, "b").hasAttribute("aria-labelledby")).toBe(false)
    expect(find(root, "line").getAttribute("role")).toBe("separator")
  })
})

describe("a submenu", () => {
  function nested(root: HTMLElement, dir?: "rtl") {
    if (dir) root.setAttribute("dir", dir)
    style(`
      .menu { display: flex; flex-direction: column; width: 120px; }
      .menu > * { height: 24px; }`)
    const drawn: { share?: Drawn; deep?: Drawn } = {}
    const top = menu(root, find(root, "m-trigger"), "m", (made) => (add) => {
      add("new", made.item(), "New")
      // The submenu's trigger is drawn inside this menu; its popup beside it.
      const element = add("share", { props: signal({}), attach: () => () => {} }, "Share")
      drawn.share = menu(
        root,
        element,
        "s",
        (share) => (addTo) => {
          addTo("mail", share.item(), "Mail")
          const more = addTo("more", { props: signal({}), attach: () => () => {} }, "More")
          drawn.deep = menu(
            root,
            more,
            "d",
            (deep) => (addDeep) => void addDeep("link", deep.item(), "Link"),
            {},
            { parent: share }
          )
        },
        {},
        { parent: made }
      )
      add("print", made.item(), "Print")
      add("quit", made.item(), "Quit")
    })
    return { top, drawn }
  }

  it("opens with the arrow the text runs to, and goes back with the other", async () => {
    const root = mount(PAGE)
    const { top, drawn } = nested(root)
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    await press("ArrowDown")
    expect(focused()).toBe("s-trigger")
    const share = find(root, "s-trigger")
    expect(share.getAttribute("role")).toBe("menuitem")
    expect(share.getAttribute("aria-haspopup")).toBe("menu")
    expect(share.getAttribute("aria-expanded")).toBe("false")
    await press("ArrowLeft")
    expect(drawn.share!.made.open.peek()).toBe(false)
    await press("ArrowRight")
    await settled()
    expect(focused()).toBe("mail")
    expect(share.getAttribute("aria-expanded")).toBe("true")
    expect(share.hasAttribute("data-highlighted")).toBe(true)
    await expect
      .poll(() => root.querySelector("#s-popup")?.parentElement?.getAttribute("data-side"))
      .toBe("right")
    await press("ArrowLeft")
    expect(focused()).toBe("s-trigger")
    expect(drawn.share!.reasons).toEqual(["list-navigation", "list-navigation"])
    expect(top.made.open.peek()).toBe(true)
  })

  it("follows the reading direction", async () => {
    const root = mount(PAGE)
    const { drawn } = nested(root, "rtl")
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    await press("ArrowDown")
    await press("ArrowRight")
    expect(drawn.share!.made.open.peek()).toBe(false)
    await press("ArrowLeft")
    await settled()
    expect(focused()).toBe("mail")
    await expect
      .poll(() => root.querySelector("#s-popup")?.parentElement?.getAttribute("data-side"))
      .toBe("left")
    await press("ArrowRight")
    expect(focused()).toBe("s-trigger")
  })

  it("Escape closes one menu at a time; a chosen item closes them all", async () => {
    const root = mount(PAGE)
    const { top, drawn } = nested(root)
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    await press("ArrowDown")
    await press("Enter")
    await settled()
    expect(focused()).toBe("mail")
    await press("ArrowDown")
    await press("ArrowRight")
    await settled()
    expect(focused()).toBe("link")
    await press("Escape")
    expect(focused()).toBe("d-trigger")
    expect(drawn.share!.made.open.peek()).toBe(true)
    await press("ArrowRight")
    await settled()
    await press("Enter")
    expect(drawn.deep!.made.open.peek()).toBe(false)
    expect(drawn.share!.made.open.peek()).toBe(false)
    expect(top.made.open.peek()).toBe(false)
    expect(focused()).toBe("m-trigger")
    expect(top.reasons.at(-1)).toBe("item-press")
  })

  it("a key in a submenu is not its menu's too", async () => {
    const root = mount(PAGE)
    nested(root)
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    await press("ArrowDown")
    await press("ArrowRight")
    await settled()
    // "p" would find Print in the menu around it.
    await press("p")
    expect(focused()).toBe("mail")
  })

  it("opens when the pointer rests on its trigger, and focus stays there", async () => {
    const root = mount(PAGE)
    const { drawn } = nested(root)
    await userEvent.click(find(root, "m-trigger"))
    await settled()
    await userEvent.hover(find(root, "s-trigger"))
    expect(drawn.share!.made.open.peek()).toBe(false)
    await wait(SUBMENU_DELAY + 50)
    expect(drawn.share!.made.open.peek()).toBe(true)
    expect(drawn.share!.reasons).toEqual(["trigger-hover"])
    expect(focused()).toBe("s-trigger")
    // A key from there still goes in.
    await press("ArrowRight")
    expect(focused()).toBe("mail")
  })

  it("closes when the pointer goes to another item of its menu", async () => {
    const root = mount(PAGE)
    const { top, drawn } = nested(root)
    await userEvent.click(find(root, "m-trigger"))
    await settled()
    await userEvent.hover(find(root, "s-trigger"))
    await wait(SUBMENU_DELAY + 50)
    await wait(SAFE_AREA_REST + 50)
    await userEvent.hover(find(root, "new"))
    expect(drawn.share!.made.open.peek()).toBe(false)
    expect(drawn.share!.reasons).toEqual(["trigger-hover", "focus-out"])
    expect(focused()).toBe("new")
    expect(top.made.open.peek()).toBe(true)
  })

  it("gives focus back whichever of the two closes first", async () => {
    const root = mount(PAGE)
    const { top, drawn } = nested(root)
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    await press("ArrowDown")
    await press("ArrowRight")
    await settled()
    expect(focused()).toBe("mail")
    // The menu first, as a caller who holds both may close them: focus is in the submenu.
    top.made.setOpen(false, details("test"))
    expect(drawn.share!.made.open.peek()).toBe(false)
    expect(focused()).toBe("m-trigger")
  })

  it("does not follow its trigger while the two are on their way out", async () => {
    const root = mount(PAGE)
    const { top } = nested(root)
    // As a design draws it: a popup at least as wide as its anchor, scaling away as it closes.
    style(`
      .menu { min-width: var(--anchor-width); transition: transform 200ms linear; }
      .menu[data-ending-style] { transform: scale(0.5); }`)
    const reported: string[] = []
    const hear = (event: ErrorEvent) => void reported.push(event.message)
    window.addEventListener("error", hear)
    onTestFinished(() => window.removeEventListener("error", hear))
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    await press("ArrowDown")
    await press("ArrowRight")
    await settled()
    await wait(50)
    const positioner = root.querySelector<HTMLElement>("#s-popup")!.parentElement!
    const width = positioner.style.getPropertyValue("--anchor-width")
    await press("Enter")
    expect(top.made.open.peek()).toBe(false)
    // Through the exit: the submenu's trigger shrinks with its menu, and the submenu is not
    // measured against it again, which resized it on every frame inside a resize observer.
    await wait(120)
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe(width)
    await wait(200)
    expect(reported.filter((each) => each.includes("ResizeObserver"))).toEqual([])
  })

  it("closes with its menu", async () => {
    const root = mount(PAGE)
    const { top, drawn } = nested(root)
    find(root, "m-trigger").focus()
    await press("Enter")
    await settled()
    await press("ArrowDown")
    await press("ArrowRight")
    await settled()
    await userEvent.click(find(root, "before"))
    expect(drawn.share!.made.open.peek()).toBe(false)
    expect(top.made.open.peek()).toBe(false)
    expect(drawn.share!.reasons.at(-1)).toBe("outside-press")
  })
})

describe("a menu opened by a press that travels", () => {
  const mouse = (element: Element, type: string, x = 0, y = 0) =>
    element.dispatchEvent(
      new PointerEvent(type, {
        pointerType: "mouse",
        button: 0,
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
      })
    )

  it("opens as the button goes down, and letting go over an item chooses it", async () => {
    const root = mount(PAGE)
    const { made, pressed, reasons } = file(root)
    const trigger = find(root, "m-trigger")
    mouse(trigger, "pointerdown", 10, 10)
    expect(made.open.peek()).toBe(true)
    await settled()
    await wait(PRESS_HOLD + 30)
    const print = find(root, "print")
    mouse(print, "pointermove", 40, 80)
    mouse(print, "pointerup", 40, 80)
    expect(pressed).toEqual(["print"])
    expect(made.open.peek()).toBe(false)
    expect(reasons).toEqual(["trigger-press", "item-press"])
  })

  it("a plain click opens it and leaves it open; the next closes it", async () => {
    const root = mount(PAGE)
    const { made, pressed } = file(root)
    const trigger = find(root, "m-trigger")
    // Down, up and click on the trigger at once: nothing is chosen, and the click does not
    // close what the press opened.
    mouse(trigger, "pointerdown", 10, 10)
    mouse(trigger, "pointerup", 10, 10)
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }))
    expect(made.open.peek()).toBe(true)
    await settled()
    // A press let go at once on an item it did not travel to chooses nothing either.
    expect(pressed).toEqual([])
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }))
    expect(made.open.peek()).toBe(false)
  })

  it("a caller who holds `open` and answers later still gets one press, not open-and-close", async () => {
    const root = mount(PAGE)
    let answer: (() => void) | undefined
    const props = signal<MenuProps>({ id: "m" })
    props.set({
      id: "m",
      open: false,
      // As Svelte and React do: the value comes back a moment after it was asked for.
      onOpenChange: (next) => void (answer = () => props.set({ ...props.peek(), open: next })),
    })
    const made = createMenu(props)
    const trigger = find(root, "m-trigger")
    onTestFinished(bind(trigger, made.trigger))
    onTestFinished(made.mount())
    mouse(trigger, "pointerdown", 10, 10)
    expect(made.open.peek()).toBe(false)
    answer!()
    expect(made.open.peek()).toBe(true)
    mouse(trigger, "pointerup", 10, 10)
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }))
    answer!()
    expect(made.open.peek()).toBe(true)
  })

  it("keeps the browser from giving the pressed button focus over the menu", async () => {
    const root = mount(PAGE)
    file(root)
    const trigger = find(root, "m-trigger")
    mouse(trigger, "pointerdown", 10, 10)
    const down = new MouseEvent("mousedown", { bubbles: true, cancelable: true })
    trigger.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    await userEvent.click(find(root, "before"))
    // Not for a press that opens nothing.
    const later = new MouseEvent("mousedown", { bubbles: true, cancelable: true })
    trigger.dispatchEvent(later)
    expect(later.defaultPrevented).toBe(false)
  })
})

describe("a modal menu", () => {
  it("holds the page: its scroll is locked, and a press outside closes it and reaches nothing", async () => {
    const root = mount(PAGE)
    const { made } = file(root, { modal: true })
    let reached = 0
    find(root, "before").addEventListener("click", () => reached++)
    await userEvent.click(find(root, "m-trigger"))
    await settled()
    expect(getComputedStyle(document.documentElement).overflow).toBe("hidden")
    // The page is not inert: the trigger is still the menu's own.
    expect(find(root, "m-trigger").closest("[inert]")).toBe(null)
    await userEvent.click(find(root, "before"))
    expect(made.open.peek()).toBe(false)
    expect(reached).toBe(0)
    await expect.poll(() => getComputedStyle(document.documentElement).overflow).not.toBe("hidden")
    // The press after it is the page's again.
    await userEvent.click(find(root, "before"))
    expect(reached).toBe(1)
  })

  it("its trigger still closes it", async () => {
    const root = mount(PAGE)
    const { made } = file(root, { modal: true })
    await userEvent.click(find(root, "m-trigger"))
    await settled()
    await userEvent.click(find(root, "m-trigger"))
    expect(made.open.peek()).toBe(false)
  })
})

describe("a context menu", () => {
  const AREA = `<button id="before">Before</button><div id="area" style="width: 300px; height: 200px">Area</div>`

  function context(root: HTMLElement, given: Partial<MenuProps> = {}) {
    return menu(
      root,
      find(root, "area"),
      "c",
      (made) => (add) => {
        add("copy", made.item(), "Copy")
        add("paste", made.item(), "Paste")
      },
      given,
      { context: true }
    )
  }

  const secondary = (element: HTMLElement, x: number, y: number) =>
    element.dispatchEvent(
      new MouseEvent("contextmenu", { clientX: x, clientY: y, bubbles: true, cancelable: true })
    )

  it("opens at the pointer in place of the browser's own, and is named by nothing absent", async () => {
    const root = mount(AREA)
    const { made, popup, reasons } = context(root)
    const area = find(root, "area")
    find(root, "before").focus()
    const box = area.getBoundingClientRect()
    const shown = secondary(area, box.left + 40, box.top + 30)
    // Prevented: the browser's menu does not open.
    expect(shown).toBe(false)
    await settled()
    expect(made.open.peek()).toBe(true)
    expect(focused()).toBe("c-popup")
    expect(popup()!.hasAttribute("aria-labelledby")).toBe(false)
    expect(area.hasAttribute("data-popup-open")).toBe(true)
    expect(area.hasAttribute("aria-haspopup")).toBe(false)
    await expect
      .poll(() => Math.round(popup()!.getBoundingClientRect().left))
      .toBe(Math.round(box.left + 40))
    expect(Math.round(popup()!.getBoundingClientRect().top)).toBe(Math.round(box.top + 30))
    await press("ArrowDown")
    expect(focused()).toBe("copy")
    await press("Escape")
    // No trigger to go back to: what had focus before has it again.
    expect(focused()).toBe("before")
    expect(reasons).toEqual(["trigger-press", "escape-key"])
  })

  it("moves to a second press while it is open", async () => {
    const root = mount(AREA)
    const { made, popup, reasons } = context(root)
    const area = find(root, "area")
    const box = area.getBoundingClientRect()
    secondary(area, box.left + 10, box.top + 10)
    await settled()
    await expect
      .poll(() => Math.round(popup()!.getBoundingClientRect().left))
      .toBe(Math.round(box.left + 10))
    // A real press this time: its pointer-down is outside the popup, and does not close it.
    await userEvent.click(area, { button: "right", position: { x: 120, y: 90 } })
    expect(made.open.peek()).toBe(true)
    expect(reasons).toEqual(["trigger-press"])
    // The press took focus to the page: the menu has it again, and the keys still work.
    expect(focused()).toBe("c-popup")
    await expect
      .poll(() => Math.round(popup()!.getBoundingClientRect().left))
      .toBe(Math.round(box.left + 120))
    expect(Math.round(popup()!.getBoundingClientRect().top)).toBe(Math.round(box.top + 90))
  })

  it("leaves the browser's own menu alone while it is disabled", () => {
    const root = mount(AREA)
    const { made } = context(root, { disabled: true })
    expect(secondary(find(root, "area"), 10, 10)).toBe(true)
    expect(made.open.peek()).toBe(false)
  })

  it("opens for a finger that rests, not for one that moves or lifts", async () => {
    const root = mount(AREA)
    const { made } = context(root)
    const area = find(root, "area")
    const touch = (type: string, x: number, y: number) =>
      area.dispatchEvent(
        new PointerEvent(type, { pointerType: "touch", clientX: x, clientY: y, bubbles: true })
      )
    touch("pointerdown", 50, 50)
    touch("pointermove", 50, 90)
    await wait(LONG_PRESS + 80)
    expect(made.open.peek()).toBe(false)
    touch("pointerdown", 50, 50)
    touch("pointerup", 50, 50)
    await wait(LONG_PRESS + 80)
    expect(made.open.peek()).toBe(false)
    // A mouse held down is not a long press.
    area.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "mouse", bubbles: true }))
    await wait(LONG_PRESS + 80)
    expect(made.open.peek()).toBe(false)
    touch("pointerdown", 50, 50)
    touch("pointermove", 53, 52)
    await wait(LONG_PRESS + 80)
    expect(made.open.peek()).toBe(true)
  })
})

describe("a menubar", () => {
  const BAR = `
    <button id="before">Before</button>
    <div id="bar">
      <button id="one">File</button>
      <button id="two">Edit</button>
      <button id="off">Off</button>
      <button id="three">View</button>
    </div>
    <button id="after">After</button>`

  function bar(root: HTMLElement, dir?: "rtl", orientation?: "vertical") {
    if (dir) root.setAttribute("dir", dir)
    const made = createMenubar(signal({ id: "bar", orientation }))
    onTestFinished(bind(find(root, "bar"), made.root))
    const menus: Record<string, Drawn> = {}
    const sub: { more?: Drawn } = {}
    for (const id of ["one", "two", "off", "three"]) {
      menus[id] = menu(
        root,
        find(root, id),
        id,
        (own) => (add) => {
          add(`${id}-a`, own.item(), "Alpha")
          if (id === "two") {
            const more = add("more", { props: signal({}), attach: () => () => {} }, "More")
            sub.more = menu(
              root,
              more,
              "more",
              (inner) => (addTo) => void addTo("deep", inner.item(), "Deep"),
              {},
              { parent: own }
            )
          }
          add(`${id}-b`, own.item(), "Beta")
        },
        { disabled: id === "off" },
        { menubar: made }
      )
    }
    return { made, menus, sub }
  }

  it("is one stop for Tab, and the arrows go along its triggers", async () => {
    const root = mount(BAR)
    bar(root)
    const one = find(root, "one-trigger")
    expect(find(root, "bar").getAttribute("role")).toBe("menubar")
    expect(one.getAttribute("role")).toBe("menuitem")
    expect(one.getAttribute("aria-haspopup")).toBe("menu")
    // Before focus has been in it, any trigger can take it.
    expect(one.getAttribute("tabindex")).toBe("0")
    expect(find(root, "three-trigger").getAttribute("tabindex")).toBe("0")
    one.focus()
    expect(find(root, "three-trigger").getAttribute("tabindex")).toBe("-1")
    await press("ArrowRight")
    expect(focused()).toBe("two-trigger")
    await press("ArrowRight")
    // Past the disabled one.
    expect(focused()).toBe("three-trigger")
    await press("ArrowRight")
    expect(focused()).toBe("one-trigger")
    await press("End")
    expect(focused()).toBe("three-trigger")
    expect(find(root, "three-trigger").getAttribute("tabindex")).toBe("0")
    expect(one.getAttribute("tabindex")).toBe("-1")
    await press("Tab")
    expect(focused()).toBe("after")
  })

  it("opens a menu with ArrowDown, and an arrow across opens the next in its place", async () => {
    const root = mount(BAR)
    const { menus } = bar(root)
    find(root, "one-trigger").focus()
    await press("ArrowDown")
    await settled()
    expect(focused()).toBe("one-a")
    await press("ArrowRight")
    await settled()
    expect(menus.one!.made.open.peek()).toBe(false)
    expect(menus.two!.made.open.peek()).toBe(true)
    expect(focused()).toBe("two-a")
    expect(menus.one!.reasons).toEqual(["trigger-press", "list-navigation"])
    await press("ArrowLeft")
    await settled()
    expect(focused()).toBe("one-a")
    await press("ArrowLeft")
    await settled()
    // Round to the last, past the disabled one.
    expect(focused()).toBe("three-a")
    await press("Escape")
    expect(focused()).toBe("three-trigger")
    expect(Object.values(menus).some((each) => each.made.open.peek())).toBe(false)
  })

  it("a submenu's arrows are its own first: in, back, and only then across", async () => {
    const root = mount(BAR)
    const { menus, sub } = bar(root)
    find(root, "two-trigger").focus()
    await press("ArrowDown")
    await settled()
    await press("ArrowDown")
    expect(focused()).toBe("more-trigger")
    await press("ArrowRight")
    await settled()
    // Into the submenu, not across to the next menu.
    expect(focused()).toBe("deep")
    expect(menus.two!.made.open.peek()).toBe(true)
    await press("ArrowLeft")
    expect(focused()).toBe("more-trigger")
    expect(menus.two!.made.open.peek()).toBe(true)
    await press("ArrowRight")
    await settled()
    await press("ArrowRight")
    await settled()
    // From an item that opens nothing, across: every menu of this one closes.
    expect(sub.more!.made.open.peek()).toBe(false)
    expect(menus.two!.made.open.peek()).toBe(false)
    expect(focused()).toBe("three-a")
  })

  it("while one is open, the pointer on another trigger opens that one instead", async () => {
    const root = mount(BAR)
    const { menus } = bar(root)
    await userEvent.hover(find(root, "two-trigger"))
    // Nothing is open: the pointer opens nothing.
    expect(menus.two!.made.open.peek()).toBe(false)
    await userEvent.click(find(root, "one-trigger"))
    await settled()
    await userEvent.hover(find(root, "two-trigger"))
    await settled()
    expect(menus.one!.made.open.peek()).toBe(false)
    expect(menus.one!.reasons.at(-1)).toBe("sibling-open")
    expect(menus.two!.made.open.peek()).toBe(true)
    expect(focused()).toBe("two-popup")
    await userEvent.hover(find(root, "off-trigger"))
    expect(menus.two!.made.open.peek()).toBe(true)
  })

  it("as a column, the arrows go down it and a menu opens beside its trigger", async () => {
    const root = mount(BAR)
    const { menus } = bar(root, undefined, "vertical")
    expect(find(root, "bar").getAttribute("aria-orientation")).toBe("vertical")
    find(root, "one-trigger").focus()
    await press("ArrowDown")
    expect(focused()).toBe("two-trigger")
    await press("ArrowUp")
    expect(focused()).toBe("one-trigger")
    await press("ArrowRight")
    await settled()
    expect(focused()).toBe("one-a")
    await expect
      .poll(() => root.querySelector("#one-popup")?.parentElement?.getAttribute("data-side"))
      .toBe("right")
    // No menu across: the arrow back closes it.
    await press("ArrowRight")
    expect(menus.one!.made.open.peek()).toBe(true)
    await press("ArrowLeft")
    expect(menus.one!.made.open.peek()).toBe(false)
    expect(focused()).toBe("one-trigger")
  })

  it("follows the reading direction", async () => {
    const root = mount(BAR)
    bar(root, "rtl")
    find(root, "one-trigger").focus()
    await press("ArrowLeft")
    expect(focused()).toBe("two-trigger")
    await press("ArrowDown")
    await settled()
    await press("ArrowLeft")
    await settled()
    expect(focused()).toBe("three-a")
  })
})

describe("the way to a submenu", () => {
  const box = new DOMRect(200, 100, 100, 200)

  it("holds between where the pointer left and the popup's near edge", () => {
    const way = createSafeArea()
    expect(way.holds(150, 150, box)).toBe(false)
    way.leave(100, 150)
    expect(way.holds(150, 150, box)).toBe(true)
    expect(way.holds(190, 250, box)).toBe(true)
    // Straight down from the trigger is not the way to the popup.
    expect(way.holds(105, 250, box)).toBe(false)
    // And once off it, it is not picked up again.
    expect(way.holds(150, 150, box)).toBe(false)
  })

  it("holds to a popup on the other side", () => {
    const way = createSafeArea()
    way.leave(400, 150)
    expect(way.holds(350, 170, box)).toBe(true)
    way.clear()
    expect(way.holds(350, 170, box)).toBe(false)
  })

  it("is not kept for a pointer that rests on it", async () => {
    const way = createSafeArea()
    way.leave(100, 150)
    await wait(SAFE_AREA_REST + 50)
    expect(way.holds(150, 150, box)).toBe(false)
  })
})
