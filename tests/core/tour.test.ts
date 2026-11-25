import { describe, expect, it, onTestFinished, vi } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { details as because } from "../../packages/core/src/part.ts"
import { effect, signal, untracked } from "../../packages/core/src/reactivity.ts"
import { faults, known } from "../../packages/core/src/testing.ts"
import { createTour } from "../../packages/core/src/tour.ts"
import type { TourProps, TourStep } from "../../packages/core/src/tour.ts"
import { tourVocabulary } from "../../packages/core/src/tour.vocabulary.ts"
import { find, focused, mount, style } from "./page.ts"

// Two targets fixed in the viewport, a third deep in a box that scrolls, and an input. The
// tour's parts are drawn at the end of `<body>` while it is mounted, as an adapter's portal
// draws them.
const PAGE = `
  <button id="before">Before</button>
  <button id="one" style="position: fixed; left: 100px; top: 300px; width: 80px; height: 30px; padding: 0; border: 0">One</button>
  <button id="two" class="second" style="position: fixed; left: 200px; top: 100px; width: 60px; height: 20px; padding: 0; border: 0">Two</button>
  <div id="box" style="position: fixed; left: 20px; top: 420px; width: 150px; height: 100px; overflow: auto">
    <div style="height: 500px"></div>
    <button id="deep" style="display: block; width: 60px; height: 20px; padding: 0; border: 0">Deep</button>
    <div style="height: 500px"></div>
  </div>
  <input id="field" />`

interface Drawn {
  portal: HTMLElement
  spotlight: HTMLElement
  positioner: HTMLElement
  popup: HTMLElement
  arrow: HTMLElement
  previous: HTMLElement
  next: HTMLElement
  close: HTMLElement
}

function tour(given: Partial<TourProps> = {}, refuse?: (reason: string) => boolean) {
  style(`
    .spotlight { position: fixed; inset: 0; }
    .popup { display: flow-root; width: 160px; height: 80px; }
    .arrow { width: 10px; height: 10px; }`)
  const root = mount(PAGE)
  const one = find(root, "one")
  const deep = find(root, "deep")
  const heard: string[] = []
  const steps: TourStep[] = [
    { id: "element", target: one },
    { id: "selector", target: ".second" },
    { id: "function", target: () => deep },
    { id: "nothing" },
  ]
  const props = signal<TourProps>({
    id: "t",
    steps,
    onOpenChange(open, by) {
      heard.push(`${open ? "open" : "close"} ${by.reason}`)
      if (refuse?.(by.reason)) by.cancel()
    },
    onStepChange(step, by) {
      heard.push(`${step} ${by.reason}`)
      if (refuse?.(by.reason)) by.cancel()
    },
    ...given,
  })
  const made = createTour(props)
  let drawn: Drawn | undefined
  let undo: (() => void)[] = []
  let draws = 0
  const draw = () => {
    draws++
    const portal = document.createElement("div")
    portal.innerHTML = `
      <div class="spotlight"></div>
      <div class="positioner">
        <div class="popup">
          <div class="arrow"></div>
          <h2 class="title">Title</h2>
          <p class="description">Text</p>
          <button class="previous">Back</button>
          <button class="next">Next</button>
          <button class="close">Close</button>
        </div>
      </div>`
    document.body.append(portal)
    const at = (name: string) => portal.querySelector<HTMLElement>(`.${name}`)!
    drawn = {
      portal,
      spotlight: at("spotlight"),
      positioner: at("positioner"),
      popup: at("popup"),
      arrow: at("arrow"),
      previous: at("previous"),
      next: at("next"),
      close: at("close"),
    }
    undo = [
      bind(drawn.spotlight, made.spotlight),
      bind(drawn.positioner, made.positioner),
      bind(drawn.popup, made.popup),
      bind(drawn.arrow, made.arrow),
      bind(at("title"), made.title),
      bind(at("description"), made.description),
      bind(drawn.previous, made.previous),
      bind(drawn.next, made.next),
      bind(drawn.close, made.close),
    ]
  }
  const erase = () => {
    for (const each of undo.reverse()) each()
    undo = []
    drawn?.portal.remove()
    drawn = undefined
  }
  const stopDrawing = effect(() => {
    const mounted = made.mounted.get()
    untracked(() => {
      if (mounted && !drawn) draw()
      else if (!mounted && drawn) erase()
    })
  })
  const unmount = made.mount()
  let gone = false
  /** Takes the whole tour out of the page, as a framework does when its component goes. */
  const remove = () => {
    if (gone) return
    gone = true
    stopDrawing()
    erase()
    unmount()
  }
  onTestFinished(() => {
    made.setOpen(false, because("test"))
    remove()
    window.scrollTo({ left: 0, top: 0, behavior: "instant" })
  })
  return {
    root,
    props,
    made,
    heard,
    one,
    deep,
    open: () => made.setOpen(true, because("test")),
    parts: () => drawn!,
    draws: () => draws,
    remove,
  }
}

const box = (element: Element) => element.getBoundingClientRect()
const variable = (element: HTMLElement, name: string) => element.style.getPropertyValue(name)
const tick = (time = 0) => new Promise((done) => setTimeout(done, time))
const key = (target: Element, name: string) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }))
const press = (target: Element) =>
  target.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse" })
  )

describe("a tour", () => {
  it("shows each step against its target: an element, a selector, a function", async () => {
    const { made, open, parts, root, deep } = tour()
    open()
    const { positioner, popup } = parts()
    const one = find(root, "one")
    // Under its target, past the spotlight's padding, and centred on it.
    await expect.poll(() => box(positioner).top).toBe(box(one).bottom + 4)
    expect(box(positioner).left + 80).toBe(box(one).left + 40)
    expect(popup.getAttribute("data-side")).toBe("bottom")
    expect(made.target.peek()).toBe(one)
    expect([made.index.peek(), made.current.peek(), made.total.peek()]).toEqual([0, 1, 4])
    expect(made.shown.peek()?.id).toBe("element")
    parts().next.click()
    const two = find(root, "two")
    await expect.poll(() => box(positioner).top).toBe(box(two).bottom + 4)
    expect(made.shown.peek()?.id).toBe("selector")
    parts().next.click()
    await expect.poll(() => made.target.peek()).toBe(deep)
    expect(made.current.peek()).toBe(3)
    await expect.poll(() => Math.round(box(positioner).top)).toBe(Math.round(box(deep).bottom + 4))
    expect(faults(document.body, known(tourVocabulary))).toEqual([])
  })

  it("shows a step with no target in the middle of the viewport, the page dimmed whole", async () => {
    const { made, open, parts } = tour({ defaultStep: 3 })
    open()
    const { positioner, popup, spotlight, arrow } = parts()
    expect(made.target.peek()).toBe(undefined)
    for (const each of [positioner, popup, spotlight, arrow]) {
      expect(each.hasAttribute("data-centered")).toBe(true)
    }
    const page = document.documentElement
    await expect
      .poll(() => Math.round(box(popup).top + box(popup).height / 2))
      .toBe(Math.round(page.clientHeight / 2))
    expect(Math.round(box(popup).left + box(popup).width / 2)).toBe(
      Math.round(page.clientWidth / 2)
    )
    await expect.poll(() => variable(spotlight, "--spotlight-width")).toBe("0px")
    expect(variable(spotlight, "--spotlight-height")).toBe("0px")
  })

  it("goes on, back, and finishes from its last step", async () => {
    const { made, open, parts, heard } = tour()
    open()
    const { previous, next } = parts()
    expect(previous.getAttribute("aria-disabled")).toBe("true")
    expect(previous.hasAttribute("data-disabled")).toBe(true)
    previous.click()
    expect(made.step.peek()).toBe(0)
    next.click()
    expect(previous.hasAttribute("aria-disabled")).toBe(false)
    previous.click()
    next.click()
    next.click()
    expect(next.hasAttribute("data-last")).toBe(false)
    next.click()
    expect(made.index.peek()).toBe(3)
    expect(next.hasAttribute("data-last")).toBe(true)
    next.click()
    expect(made.open.peek()).toBe(false)
    expect(heard).toEqual([
      "open test",
      "1 next-press",
      "0 previous-press",
      "1 next-press",
      "2 next-press",
      "3 next-press",
      "close finish",
    ])
  })

  it("closes by its close button and by Escape", async () => {
    const { made, open, parts, heard } = tour()
    open()
    parts().close.click()
    expect(made.open.peek()).toBe(false)
    open()
    await tick()
    key(document.activeElement ?? document.body, "Escape")
    expect(made.open.peek()).toBe(false)
    expect(heard).toEqual(["open test", "close close-press", "open test", "close escape-key"])
  })

  it("moves its popup from step to step, and never draws it again", async () => {
    const { made, open, parts, draws } = tour()
    const unmounted: boolean[] = []
    onTestFinished(made.mounted.subscribe(() => unmounted.push(made.mounted.peek())))
    open()
    const { popup, positioner } = parts()
    await expect.poll(() => positioner.style.transform).not.toBe("")
    const first = positioner.style.transform
    for (let step = 1; step < 4; step++) {
      parts().next.click()
      await tick()
      expect(parts().popup).toBe(popup)
    }
    expect(positioner.style.transform).not.toBe(first)
    expect(draws()).toBe(1)
    expect(unmounted).toEqual([true])
    expect(popup.isConnected).toBe(true)
  })

  it("keeps the spotlight's hole on its target as it moves and scrolls, and stops when it closes", async () => {
    const { made, open, parts, one } = tour({ spotlightPadding: 6 })
    // An exit long enough to scroll during it.
    style(`.popup { transition: opacity 400ms; } .popup[data-ending-style] { opacity: 0; }`)
    open()
    const { spotlight } = parts()
    expect(variable(spotlight, "--spotlight-left")).toBe("94px")
    expect(variable(spotlight, "--spotlight-top")).toBe("294px")
    expect(variable(spotlight, "--spotlight-width")).toBe("92px")
    expect(variable(spotlight, "--spotlight-height")).toBe("42px")
    one.style.top = "200px"
    await expect.poll(() => variable(spotlight, "--spotlight-top")).toBe("194px")
    one.style.width = "100px"
    await expect.poll(() => variable(spotlight, "--spotlight-width")).toBe("112px")
    // A target in a box that scrolls: the hole goes with it.
    made.setStep(2, because("test"))
    const scroller = document.querySelector<HTMLElement>("#box")!
    const deep = document.querySelector<HTMLElement>("#deep")!
    await expect.poll(() => variable(spotlight, "--spotlight-top")).toBe(`${box(deep).top - 6}px`)
    scroller.scrollTop -= 30
    await expect.poll(() => variable(spotlight, "--spotlight-top")).toBe(`${box(deep).top - 6}px`)
    const before = variable(spotlight, "--spotlight-top")
    made.setOpen(false, because("test"))
    scroller.scrollTop -= 30
    await tick(50)
    expect(spotlight.isConnected).toBe(true)
    expect(variable(spotlight, "--spotlight-top")).toBe(before)
  })

  it("waits for a target drawn late, and shows a step whose target never comes in the middle", async () => {
    const { made, open, root, parts } = tour({
      steps: [
        { id: "first", target: "#one" },
        { id: "late", target: "#late" },
        { id: "never", target: () => document.querySelector("#never") },
      ],
      waitForTarget: 300,
    })
    open()
    parts().next.click()
    expect(made.step.peek()).toBe(1)
    // Still the step before while it waits.
    expect(made.index.peek()).toBe(0)
    await tick(20)
    expect(made.index.peek()).toBe(0)
    const late = document.createElement("button")
    late.id = "late"
    late.textContent = "Late"
    late.style.cssText = "position: fixed; left: 250px; top: 200px; width: 40px; height: 20px"
    root.append(late)
    await expect.poll(() => made.index.peek()).toBe(1)
    expect(made.target.peek()).toBe(late)
    const { positioner } = parts()
    await expect.poll(() => box(positioner).top).toBe(box(late).bottom + 4)
    parts().next.click()
    expect(made.index.peek()).toBe(1)
    await expect.poll(() => made.index.peek(), { timeout: 2000 }).toBe(2)
    expect(made.target.peek()).toBe(undefined)
    expect(parts().popup.hasAttribute("data-centered")).toBe(true)
  })

  it("is not drawn until its first step is found, when it opens on one drawn late", async () => {
    const { made, open, root, parts } = tour({
      steps: [{ id: "late", target: "#late" }],
    })
    open()
    expect(made.open.peek()).toBe(true)
    expect(made.mounted.peek()).toBe(false)
    const late = document.createElement("button")
    late.id = "late"
    late.style.cssText = "position: fixed; left: 250px; top: 200px; width: 40px; height: 20px"
    root.append(late)
    await expect.poll(() => made.mounted.peek()).toBe(true)
    expect(made.target.peek()).toBe(late)
    expect(parts().popup.hasAttribute("data-centered")).toBe(false)
  })

  it("brings a target in a box that scrolls into view, and leaves the page where it is", () => {
    const { made, open, root, deep } = tour({ defaultStep: 2 })
    const scroller = find(root, "box")
    expect(scroller.scrollTop).toBe(0)
    open()
    expect(made.target.peek()).toBe(deep)
    // Inside its box, and the box is fixed: the page does not move.
    expect(box(deep).top).toBeGreaterThanOrEqual(box(scroller).top)
    expect(box(deep).bottom).toBeLessThanOrEqual(box(scroller).bottom)
    expect(scroller.scrollTop).toBeGreaterThan(0)
    expect(window.scrollY).toBe(0)
  })

  it("scrolls the page to a target far down it, not to the top", async () => {
    const tall = document.createElement("div")
    tall.style.height = "4000px"
    const far = document.createElement("button")
    far.textContent = "Far"
    far.style.cssText = "position: absolute; left: 10px; top: 3000px; width: 50px; height: 20px"
    const { made, open, root, parts } = tour({
      steps: [
        { id: "far", target: far },
        { id: "near", target: "#before" },
      ],
    })
    root.append(tall, far)
    open()
    expect(window.scrollY).toBeGreaterThan(2000)
    const seen = box(far)
    expect(seen.top).toBeGreaterThanOrEqual(0)
    expect(seen.bottom).toBeLessThanOrEqual(document.documentElement.clientHeight)
    const { positioner } = parts()
    await expect.poll(() => Math.round(box(positioner).top)).toBe(Math.round(box(far).bottom + 4))
    // Back up to a target at the top of the page.
    parts().next.click()
    expect(made.index.peek()).toBe(1)
    expect(box(find(root, "before")).top).toBeGreaterThanOrEqual(0)
    expect(window.scrollY).toBeLessThan(100)
  })

  it("moves focus in as it opens, keeps it in across steps, and gives it back as it ends", async () => {
    const { open, parts, root, made } = tour()
    find(root, "before").focus()
    open()
    expect(document.activeElement).toBe(parts().next)
    parts().next.click()
    expect(document.activeElement).toBe(parts().next)
    // Back to the first step: the previous button is said to be disabled, and keeps focus.
    parts().previous.focus()
    parts().previous.click()
    expect(made.index.peek()).toBe(0)
    expect(document.activeElement).toBe(parts().previous)
    parts().close.click()
    expect(focused()).toBe("before")
  })

  it("keeps Tab inside its popup while the target cannot be used", async () => {
    const { open, parts } = tour()
    open()
    parts().close.focus()
    parts().close.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })
    )
    expect(document.activeElement).toBe(parts().previous)
  })

  it("stays as it was when its caller refuses", async () => {
    const refused = new Set(["test", "next-press"])
    const { made, open, heard } = tour({}, (reason) => refused.has(reason))
    open()
    expect(made.open.peek()).toBe(false)
    expect(made.mounted.peek()).toBe(false)
    refused.delete("test")
    open()
    expect(made.open.peek()).toBe(true)
    const next = document.querySelector<HTMLElement>(".next")!
    next.click()
    expect(made.step.peek()).toBe(0)
    expect(made.index.peek()).toBe(0)
    refused.add("close-press")
    document.querySelector<HTMLElement>(".close")!.click()
    expect(made.open.peek()).toBe(true)
    expect(heard).toEqual(["open test", "open test", "1 next-press", "close close-press"])
  })

  it("follows the values its caller holds, and asks for changes without making them", async () => {
    const { made, props, parts, heard, root } = tour({ open: false, step: 1 })
    props.set({ ...props.peek(), open: true })
    expect(made.open.peek()).toBe(true)
    expect(made.target.peek()).toBe(find(root, "two"))
    parts().next.click()
    // Asked, not done: the caller has not given it yet.
    expect(heard).toEqual(["2 next-press"])
    expect(made.index.peek()).toBe(1)
    props.set({ ...props.peek(), step: 2 })
    expect(made.index.peek()).toBe(2)
    parts().close.click()
    expect(made.open.peek()).toBe(true)
    props.set({ ...props.peek(), open: false })
    expect(made.open.peek()).toBe(false)
    expect(heard).toEqual(["2 next-press", "close close-press"])
  })

  it("lets the target be seen, not used, unless it is interactive", async () => {
    const { made, open, parts, root, one, heard } = tour()
    open()
    const { spotlight } = parts()
    expect(one.closest("[inert]")).not.toBe(null)
    expect(find(root, "before").closest("[inert]")).not.toBe(null)
    expect(spotlight.closest("[inert]")).toBe(null)
    expect(parts().popup.closest("[inert]")).toBe(null)
    expect(parts().popup.getAttribute("aria-modal")).toBe("true")
    expect(getComputedStyle(spotlight).pointerEvents).toBe("auto")
    // A press on the dimmed page closes nothing, by default.
    press(spotlight)
    expect(made.open.peek()).toBe(true)
    made.setOpen(false, because("test"))
    expect(one.closest("[inert]")).toBe(null)
    expect(heard).toEqual(["open test", "close test"])
  })

  it("lets an interactive step's target be used, and keeps the rest of the page inert", async () => {
    const { made, open, parts, root, one } = tour({
      interactive: true,
      closeOnOutsidePress: true,
    })
    open()
    const { spotlight, popup } = parts()
    expect(one.closest("[inert]")).toBe(null)
    expect(find(root, "before").closest("[inert]")).not.toBe(null)
    expect(find(root, "two").closest("[inert]")).not.toBe(null)
    expect(popup.hasAttribute("aria-modal")).toBe(false)
    expect(spotlight.style.pointerEvents).toBe("none")
    // The target is the tour's own: a press on it is not outside.
    press(one)
    expect(made.open.peek()).toBe(true)
    // The next step's target is live, the last one's inert again.
    parts().next.click()
    expect(one.closest("[inert]")).not.toBe(null)
    expect(find(root, "two").closest("[inert]")).toBe(null)
    // Anywhere else is outside.
    press(document.body)
    expect(made.open.peek()).toBe(false)
  })

  it("closes on a press on the dimmed page when asked to", async () => {
    const { made, open, parts, heard } = tour({ closeOnOutsidePress: true })
    open()
    press(parts().spotlight)
    expect(made.open.peek()).toBe(false)
    expect(heard).toEqual(["open test", "close outside-press"])
  })

  it("goes on and back with the arrows, unless focus is in something that takes them", async () => {
    const { made, open, parts, heard, props } = tour()
    open()
    key(parts().next, "ArrowRight")
    expect(made.index.peek()).toBe(1)
    key(parts().next, "ArrowLeft")
    expect(made.index.peek()).toBe(0)
    // Nothing before the first step.
    key(parts().next, "ArrowLeft")
    expect(made.index.peek()).toBe(0)
    // An input in the popup keeps its arrows.
    const input = document.createElement("input")
    parts().popup.append(input)
    key(input, "ArrowRight")
    expect(made.index.peek()).toBe(0)
    props.set({ ...props.peek(), keyboardNavigation: false })
    key(parts().next, "ArrowRight")
    expect(made.index.peek()).toBe(0)
    expect(heard).toEqual(["open test", "1 next-key", "0 previous-key"])
  })

  it("leaves nothing behind when it is taken out of the page while open", async () => {
    const added = vi.spyOn(document, "addEventListener")
    const removed = vi.spyOn(document, "removeEventListener")
    onTestFinished(() => {
      added.mockRestore()
      removed.mockRestore()
    })
    const { made, open, parts, root, one, remove, heard } = tour({
      steps: [
        { id: "first", target: "#one" },
        { id: "late", target: "#late" },
      ],
      waitForTarget: 100,
    })
    open()
    const { spotlight } = parts()
    expect(one.closest("[inert]")).not.toBe(null)
    // Waiting for a target that is not drawn yet.
    parts().next.click()
    remove()
    expect(root.querySelectorAll("[inert]").length).toBe(0)
    expect(document.body.querySelectorAll(":scope > [inert]").length).toBe(0)
    // Every listener it added to the document it took off again.
    const left = new Map<unknown, number>()
    for (const [, listener] of added.mock.calls) left.set(listener, (left.get(listener) ?? 0) + 1)
    for (const [, listener] of removed.mock.calls) left.set(listener, (left.get(listener) ?? 0) - 1)
    expect([...left.values()].filter((count) => count > 0)).toEqual([])
    // No key reaches it, no observer follows the target, no wait ends.
    const top = variable(spotlight, "--spotlight-top")
    key(document.body, "Escape")
    key(document.body, "ArrowRight")
    one.style.top = "50px"
    const late = document.createElement("button")
    late.id = "late"
    late.style.cssText = "position: fixed; left: 10px; top: 10px; width: 20px; height: 20px"
    root.append(late)
    await tick(200)
    expect(variable(spotlight, "--spotlight-top")).toBe(top)
    expect(made.index.peek()).toBe(0)
    expect(made.target.peek()).toBe(one)
    expect(heard).toEqual(["open test", "1 next-press"])
  })
})
