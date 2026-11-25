import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { createSteps } from "../../packages/core/src/steps.ts"
import type { StepsProps } from "../../packages/core/src/steps.ts"
import { recorder } from "../../packages/core/src/testing.ts"
import { mount } from "./page.ts"

function steps(given: Partial<StepsProps> = {}) {
  const root = mount(`
    <div class="root"><div class="list">
      ${[0, 1, 2].map((each) => `<div class="item"><button class="trigger" data-i="${each}"></button><i class="separator" data-i="${each}"></i></div>`).join("")}
    </div>
    ${[0, 1, 2].map((each) => `<div class="content" data-i="${each}">Step ${each}</div>`).join("")}
    <div class="completed">Done</div>
    <button class="previous">Back</button><button class="next">Next</button></div>`)
  const changed = recorder<number>()
  const made = createSteps(
    signal<StepsProps>({ id: "st", count: 3, onStepChange: changed.listen, ...given })
  )
  const all = <T extends HTMLElement = HTMLElement>(name: string) => [
    ...root.querySelectorAll<T>(name),
  ]
  onTestFinished(bind(all(".root")[0]!, made.root))
  onTestFinished(bind(all(".list")[0]!, made.list))
  all(".item").forEach((each, at) => onTestFinished(bind(each, made.item(at))))
  for (const name of ["trigger", "separator", "content"] as const)
    for (const each of all(`.${name}`))
      onTestFinished(bind(each, made[name](Number(each.dataset.i))))
  onTestFinished(bind(all(".completed")[0]!, made.completed))
  onTestFinished(bind(all(".previous")[0]!, made.previous))
  onTestFinished(bind(all(".next")[0]!, made.next))
  const shown = () =>
    all(".content, .completed")
      .filter((each) => !each.hidden)
      .map((each) => each.textContent)
  return { root, made, all, changed, shown }
}

describe("steps", () => {
  it("are tabs with their panels: one shown, the ones before it done", () => {
    const { all, shown } = steps({ defaultStep: 1 })
    const triggers = all(".trigger")
    expect(all(".list")[0]!.getAttribute("role")).toBe("tablist")
    expect(triggers.map((each) => each.getAttribute("aria-selected"))).toEqual([
      "false",
      "true",
      "false",
    ])
    expect(triggers.map((each) => each.getAttribute("tabindex"))).toEqual(["-1", "0", "-1"])
    expect(triggers[1]!.getAttribute("aria-controls")).toBe("st-content-1")
    expect(all(".content")[1]!.getAttribute("aria-labelledby")).toBe("st-trigger-1")
    expect(
      all(".item").map(
        (each) =>
          [...each.attributes].map((a) => a.name).filter((n) => /current|complete/.test(n))[0]
      )
    ).toEqual(["data-complete", "data-current", "data-incomplete"])
    expect(shown()).toEqual(["Step 1"])
  })

  it("go on and back by their buttons, to all of them done and no further", () => {
    const { all, made, changed, shown } = steps()
    const next = all<HTMLButtonElement>(".next")[0]!
    const previous = all<HTMLButtonElement>(".previous")[0]!
    expect(previous.disabled).toBe(true)
    next.click()
    expect(changed.calls.at(-1)).toMatchObject({ value: 1, reason: "next-press" })
    next.click()
    next.click()
    expect(made.step.peek()).toBe(3)
    expect(shown()).toEqual(["Done"])
    expect(next.disabled).toBe(true)
    expect(all(".root")[0]!.hasAttribute("data-complete")).toBe(true)
    // Tab still stops somewhere: at the last step.
    expect(all(".trigger").map((each) => each.getAttribute("tabindex"))).toEqual(["-1", "-1", "0"])
    previous.click()
    expect(made.step.peek()).toBe(2)
  })

  it("are gone to by a press, and moved between with the arrows without going", () => {
    const { all, made } = steps()
    const triggers = all(".trigger")
    triggers[2]!.click()
    expect(made.step.peek()).toBe(2)
    triggers[2]!.focus()
    triggers[2]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true })
    )
    expect(document.activeElement).toBe(triggers[1])
    expect(made.step.peek()).toBe(2)
  })

  it("in order only, cannot skip to a step that is not reached", () => {
    const { all, made } = steps({ linear: true, defaultStep: 1 })
    const triggers = all(".trigger")
    expect(triggers[2]!.getAttribute("aria-disabled")).toBe("true")
    triggers[2]!.click()
    expect(made.step.peek()).toBe(1)
    triggers[0]!.click()
    expect(made.step.peek()).toBe(0)
  })

  it("may be refused, and holds a step that is none to the nearest that is", () => {
    const refused = steps({ onStepChange: (_step, by) => by.cancel() })
    refused.all<HTMLButtonElement>(".next")[0]!.click()
    expect(refused.made.step.peek()).toBe(0)
    expect(steps({ step: 9 }).made.step.peek()).toBe(3)
    expect(steps({ step: -2 }).made.step.peek()).toBe(0)
  })

  it("count an item with no index, and no count, from the page, as the page changes", async () => {
    const root = mount(
      `<div class="list"><div id="a"><button id="a-t"></button></div><div id="b"><button id="b-t"></button></div></div><div id="done">Done</div>`
    )
    const made = createSteps(signal<StepsProps>({ id: "sc", defaultStep: 1 }))
    const a = made.item()
    const b = made.item()
    // Not in the page yet, as on a server: no item is a step, and none is the last.
    expect(a.index.peek()).toBe(-1)
    expect(made.count.peek()).toBe(0)
    expect(made.step.peek()).toBe(1)
    expect(made.completed.props.peek().hidden).toBe("")
    expect(made.trigger(a.index).props.peek().id).toBeUndefined()
    // Bound the other way round from the page's order: the page's is what counts. Found
    // before they are bound: a trigger writes its own id.
    const [itemA, itemB, triggerA, triggerB, done] = ["a", "b", "a-t", "b-t", "done"].map((id) =>
      root.querySelector<HTMLElement>(`#${id}`)!
    ) as [HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement]
    const byId = (id: string) =>
      ({ a: itemA, b: itemB, "a-t": triggerA, "b-t": triggerB, done })[id]!
    onTestFinished(bind(itemB, b))
    onTestFinished(bind(itemA, a))
    onTestFinished(bind(triggerA, made.trigger(a.index)))
    onTestFinished(bind(triggerB, made.trigger(b.index)))
    onTestFinished(bind(done, made.completed))
    await expect.poll(() => [a.index.peek(), b.index.peek(), made.count.peek()]).toEqual([0, 1, 2])
    expect(byId("b").hasAttribute("data-current")).toBe(true)
    expect(byId("a").hasAttribute("data-complete")).toBe(true)
    expect(byId("b-t").id).toBe("sc-trigger-1")
    expect(byId("done").hidden).toBe(true)
    // An item put in before them moves them on, and is counted.
    const first = document.createElement("div")
    byId("a").before(first)
    onTestFinished(bind(first, made.item()))
    await expect.poll(() => [a.index.peek(), b.index.peek(), made.count.peek()]).toEqual([1, 2, 3])
    expect(byId("a").hasAttribute("data-current")).toBe(true)
    expect(byId("a-t").id).toBe("sc-trigger-1")
    // An index given is taken, and a count given is the count.
    expect(made.item(5).index.peek()).toBe(5)
    const counted = createSteps(signal<StepsProps>({ id: "sd", count: 7 }))
    expect(counted.count.peek()).toBe(7)
  })
})
