import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { createMeter } from "../../packages/core/src/meter.ts"
import type { MeterProps } from "../../packages/core/src/meter.ts"
import { createProgress } from "../../packages/core/src/progress.ts"
import type { ProgressProps } from "../../packages/core/src/progress.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { mount } from "./page.ts"

const PAGE = `<div class="root"><div class="track"><div class="fill"></div></div></div>`

function drawn(made: ReturnType<typeof createProgress>) {
  const root = mount(PAGE)
  const find = (name: string) => root.querySelector<HTMLElement>(name)!
  onTestFinished(bind(find(".root"), made.root))
  onTestFinished(bind(find(".track"), made.track))
  onTestFinished(bind(find(".fill"), made.indicator))
  return find
}

describe("a progress bar's value as a variable", () => {
  it("writes the value's share of the range on the root, which every part inherits", () => {
    const props = signal<ProgressProps>({ id: "p", value: 30, min: 20, max: 70 })
    const made = createProgress(props)
    // Known before anything is drawn, so a server writes it.
    expect(made.root.props.peek().style).toEqual({ "--progress-value": "0.2" })
    const find = drawn(made)
    expect(find(".root").style.getPropertyValue("--progress-value")).toBe("0.2")
    expect(getComputedStyle(find(".fill")).getPropertyValue("--progress-value")).toBe("0.2")
    // The indicator's width is still the value's share as a length.
    expect(find(".fill").style.width).toBe("20%")
    props.set({ id: "p", value: 70, min: 20, max: 70 })
    expect(find(".root").style.getPropertyValue("--progress-value")).toBe("1")
  })

  it("writes none while how far the task has come is not known", () => {
    const props = signal<ProgressProps>({ id: "p", value: null })
    const made = createProgress(props)
    expect(made.root.props.peek().style).toBeUndefined()
    const find = drawn(made)
    expect(find(".root").style.getPropertyValue("--progress-value")).toBe("")
    props.set({ id: "p", value: 40 })
    expect(find(".root").style.getPropertyValue("--progress-value")).toBe("0.4")
    props.set({ id: "p", value: null })
    expect(find(".root").style.getPropertyValue("--progress-value")).toBe("")
  })

  it("is the meter's own on a meter", () => {
    const made = createMeter(signal<MeterProps>({ id: "m", value: 30, max: 60 }))
    const find = drawn(made)
    expect(find(".root").style.getPropertyValue("--meter-value")).toBe("0.5")
    expect(find(".root").style.getPropertyValue("--progress-value")).toBe("")
  })
})
