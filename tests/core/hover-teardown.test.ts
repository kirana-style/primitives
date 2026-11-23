import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createHoverCard } from "../../packages/core/src/hover-card.ts"
import type { HoverPopup, HoverPopupProps } from "../../packages/core/src/hover-popup.ts"
import { createPopover } from "../../packages/core/src/popover.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { createTooltip } from "../../packages/core/src/tooltip.ts"
import { find, park } from "./page.ts"

// The page's one open hover popup, and the moment one last closed, are shared by every popup
// with no provider. A popup whose page goes away while it is open (a route changes, a test
// unmounts) gives them up: the next page's popups are not its siblings.

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const TRIGGER = "position: fixed; left: 10px; top: 10px; width: 100px; height: 30px"
const POPUP = "position: fixed; left: 10px; top: 50px; width: 100px; height: 30px"

type Made = Pick<HoverPopup, "open" | "mounted" | "trigger" | "popup" | "mount">

/**
 * A page with one popup on it, bound as an adapter binds it, the popup drawn only while it is
 * in the page (as a portal draws it); `leave()` takes the page away as a framework does: every
 * part detached and the controller stopped, whatever it was doing, and its elements gone.
 */
function page(made: Made, trigger = TRIGGER, popup = POPUP) {
  const root = document.createElement("div")
  root.innerHTML = `
    <button id="trigger" style="${trigger}">T</button>
    <div id="popup" style="${popup}"><button>Inside</button></div>`
  document.body.append(root)
  const triggerElement = find(root, "trigger")
  const popupElement = find(root, "popup")
  const stops = [
    bind(triggerElement, made.trigger),
    bind(popupElement, made.popup),
    made.mount(),
    effect(() => {
      popupElement.style.display = made.mounted.get() ? "" : "none"
    }),
  ]
  let gone = false
  const leave = () => {
    if (gone) return
    gone = true
    for (const stop of stops.reverse()) stop()
    root.remove()
  }
  onTestFinished(leave)
  return { trigger: triggerElement, leave }
}

type Kind = "tooltip" | "hover card" | "popover"

/** A popup of `kind` that opens on hover, and what it was told. */
function make(kind: Kind, delay?: number) {
  const heard: string[] = []
  const props: HoverPopupProps = {
    id: kind.replace(" ", "-"),
    onOpenChange: (open, by) => heard.push(`${open ? "open" : "close"}: ${by.reason}`),
    delay,
  }
  if (kind === "popover") {
    const popover = createPopover(signal(props))
    popover.hovering.set({ openOnHover: true, delay })
    return { made: popover as Made, heard }
  }
  const create = kind === "tooltip" ? createTooltip : createHoverCard
  return { made: create(signal(props)) as Made, heard }
}

const KINDS: Kind[] = ["tooltip", "hover card", "popover"]

describe("a hover popup whose page left while it was open", () => {
  for (const before of KINDS) {
    for (const after of KINDS) {
      it(`is not the next page's: a ${after} after a ${before} waits its own wait`, async () => {
        await park()
        const first = make(before, 0)
        const a = page(first.made)
        await userEvent.hover(a.trigger)
        await wait(50)
        expect(first.made.open.peek()).toBe(true)
        a.leave()

        // A wait far longer than a hover takes to arrive, so "not yet" is not a race.
        const second = make(after, 5000)
        const b = page(second.made)
        await userEvent.hover(b.trigger)
        // Not at once, as for a sibling the pointer came from.
        expect(second.made.open.peek()).toBe(false)
        // The popup that left is not closed for it: nothing is told to a page that is gone.
        expect(first.heard).toEqual(["open: trigger-hover"])
        // Its page leaves with it open too (`onTestFinished`), so the next test starts clean.
      })
    }
  }

  it("leaves a hover card pressed on the next page closable", async () => {
    await park()
    const tooltip = make("tooltip")
    const a = page(tooltip.made)
    await userEvent.hover(a.trigger)
    await wait(700)
    expect(tooltip.made.open.peek()).toBe(true)
    a.leave()

    // The card opens to the trigger's left over the trigger's middle, as a negative offset
    // puts it: once open, it is what a press on the trigger reaches.
    const card = make("hover card")
    const b = page(
      card.made,
      "position: fixed; left: 300px; top: 100px; width: 36px; height: 36px",
      "position: fixed; left: 70px; top: 60px; width: 256px; height: 120px"
    )
    await userEvent.click(b.trigger, { timeout: 2000 })
    await userEvent.keyboard("{Escape}")
    await park()
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    await wait(700)
    expect(card.made.open.peek()).toBe(false)
    // The press came before its wait ended: it never opened.
    expect(card.heard).toEqual([])
  })
})
