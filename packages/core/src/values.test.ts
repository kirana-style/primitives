import { describe, expect, expectTypeOf, it } from "vite-plus/test"

import { createMenu } from "./menu.ts"
import type { MenuRadioGroupProps } from "./menu.ts"
import { details } from "./part.ts"
import type { RadioGroupProps } from "./radio-group.ts"
import { signal } from "./reactivity.ts"
import { createSlider } from "./slider.ts"
import type { SliderChangeDetails, SliderProps } from "./slider.ts"
import { createTabs } from "./tabs.ts"
import type { TabsProps } from "./tabs.ts"

type Told<Callback> = Callback extends (value: infer Value, ...rest: never[]) => unknown
  ? Value
  : never

// What a change callback is told, by its type and by what the controller does.
describe("a slider's value", () => {
  it("comes back as it was given: a number, or a range's list", () => {
    expectTypeOf<Told<SliderProps<number>["onValueChange"]>>().toEqualTypeOf<number>()
    expectTypeOf<Told<SliderProps<number[]>["onValueCommitted"]>>().toEqualTypeOf<number[]>()
    expectTypeOf<Told<SliderProps<readonly number[]>["onValueChange"]>>().toEqualTypeOf<number[]>()
    // With no type of the caller's, either.
    expectTypeOf<Told<SliderProps["onValueChange"]>>().toEqualTypeOf<number | number[]>()

    const told: unknown[] = []
    const by = () => Object.assign(details("test"), { index: 0 }) as SliderChangeDetails
    const one = createSlider(
      signal<SliderProps<number>>({
        id: "one",
        defaultValue: 20,
        onValueChange: (value) => told.push(value.toFixed(0)),
      })
    )
    one.setValue(0, 30, by())
    const range = createSlider(
      signal<SliderProps<number[]>>({
        id: "range",
        defaultValue: [20, 80],
        onValueChange: (value) => told.push(value.join("-")),
      })
    )
    range.setValue(0, 30, by())
    expect(told).toEqual(["30", "30-80"])
  })
})

describe("the value tabs and a menu's radio group tell", () => {
  it("is a tab's or an item's own, never the `null` they may begin with", () => {
    expectTypeOf<Told<TabsProps<string>["onValueChange"]>>().toEqualTypeOf<string>()
    expectTypeOf<Told<MenuRadioGroupProps<string>["onValueChange"]>>().toEqualTypeOf<string>()
    // A radio group is put back to none by its form's reset, and says so.
    expectTypeOf<Told<RadioGroupProps<string>["onValueChange"]>>().toEqualTypeOf<string | null>()

    const told: unknown[] = []
    const tabs = createTabs(
      signal<TabsProps<string>>({
        id: "t",
        defaultValue: null,
        onValueChange: (value) => told.push(value),
      })
    )
    expect(tabs.value.peek()).toBeNull()
    tabs.setValue("a", details("press"))
    tabs.setValue("a", details("press"))
    const group = createMenu(signal({ id: "m" })).radioGroup(
      signal<MenuRadioGroupProps<string>>({
        defaultValue: null,
        onValueChange: (value) => told.push(value),
      })
    )
    const press = group.item("b").props.peek().onClick as (event: object) => void
    press({ type: "click", detail: 0, preventDefault() {}, currentTarget: null, target: null })
    expect(told).toEqual(["a", "b"])
  })
})
