import type { ChangeDetails } from "@kirana-ui/core"
import { describe, expectTypeOf, it } from "vite-plus/test"
import { h } from "vue"
import type { Component } from "vue"

import { Calendar, Collapsible, Menu, RadioGroup, Select, Slider, Tabs } from "./index.ts"
import type { DateRange } from "./index.ts"
import type { PanelProps, RootEmits } from "./collapsible.ts"
import { partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, PartEvent } from "./runtime.ts"
import type { RootProps as TabsRootProps } from "./tabs.ts"

type Props<Part extends abstract new (...given: never[]) => unknown> =
  InstanceType<Part> extends { $props: infer Given } ? Given : never
// Only the types are held here: each check is a function that is never called, so no
// component is made.
describe("a part's type", () => {
  it("carries its own props, its element's attributes and its slot's state", () => {
    const check = () => {
      expectTypeOf<Props<typeof Collapsible.Panel>["keepMounted"]>().toEqualTypeOf<
        boolean | undefined
      >()
      // Drawn as its own tag unless `as` names another: the attributes are that tag's.
      const trigger = new Collapsible.Trigger({})
      expectTypeOf(trigger.$props.as).toEqualTypeOf<"button" | undefined>()
      expectTypeOf(trigger.$props.type).toEqualTypeOf<"reset" | "submit" | "button" | undefined>()
      const link = new Collapsible.Trigger({ as: "a", href: "/more" })
      expectTypeOf(link.$props.href).toEqualTypeOf<string | undefined>()
      // @ts-expect-error a `<button>` has no `href`
      new Collapsible.Trigger({ href: "/more" })
      // A listener's event can keep the part's own listener out of it.
      expectTypeOf<NonNullable<typeof trigger.$props.onClick>>()
        .parameter(0)
        .toExtend<PartEvent<MouseEvent>>()
      // A select's value hands its slot its state beside what is chosen.
      const value = new Select.Value({})
      expectTypeOf(value.$slots.default).parameter(0).toExtend<{
        state: { readonly placeholder?: true | undefined }
        label: unknown
      }>()
      expectTypeOf(trigger.$slots.default).parameter(0).toEqualTypeOf<{
        state: { readonly panelOpen?: true | undefined; readonly disabled?: true | undefined }
      }>()
      // The named type of a part's props is what a wrapper declares.
      expectTypeOf<PanelProps>().toExtend<PartComponentProps>()
      expectTypeOf<PanelProps["keepMounted"]>().toEqualTypeOf<boolean | undefined>()
    }
    expectTypeOf(check).toBeFunction()
  })

  it("names its events with their payloads", () => {
    const check = () => {
      expectTypeOf<RootEmits["openChange"]>().toEqualTypeOf<
        (value: boolean, details: ChangeDetails) => void
      >()
      expectTypeOf<Props<typeof Collapsible.Root>["onOpenChange"]>().toEqualTypeOf<
        ((value: boolean, details: ChangeDetails) => void) | undefined
      >()
      expectTypeOf<Props<typeof Collapsible.Root>["onUpdate:open"]>().toEqualTypeOf<
        ((value: boolean) => void) | undefined
      >()
    }
    expectTypeOf(check).toBeFunction()
  })

  it("is a component to Vue: `h` takes it, with its props checked", () => {
    const check = () => {
      const made: Component[] = [Collapsible.Root, Tabs.Root, Select.Root, Menu.RadioGroup]
      expectTypeOf(made).toEqualTypeOf<Component[]>()
      h(Tabs.Root, { defaultValue: "one" })
      h(Collapsible.Panel, { keepMounted: true })
      // @ts-expect-error `keepMounted` is a boolean
      h(Collapsible.Panel, { keepMounted: 3 })
    }
    expectTypeOf(check).toBeFunction()
  })

  it("is generic in a root's value", () => {
    const check = () => {
      expectTypeOf<TabsRootProps<number>["value"]>().toEqualTypeOf<number | null | undefined>()
      const tabs = new Tabs.Root({ value: "one" })
      expectTypeOf(tabs.$props.onValueChange).toEqualTypeOf<
        ((value: string, details: ChangeDetails) => void) | undefined
      >()
      // A group that can be put back to none tells `null`.
      const group = new RadioGroup.Root({ defaultValue: 1 })
      expectTypeOf(group.$props["onUpdate:value"]).toEqualTypeOf<
        ((value: number | null) => void) | undefined
      >()
      // A slider tells what it was given: a number, or a list for a range.
      const range = new Slider.Root({ value: [20, 80] })
      expectTypeOf(range.$props["onUpdate:value"]).toEqualTypeOf<
        ((value: number[]) => void) | undefined
      >()
      // @ts-expect-error a number where the default says the value is a string
      new Tabs.Root({ value: 1, defaultValue: "one" })
      // A calendar's value is its mode's: a day, a range, or a list of days.
      const day = new Calendar.Root({})
      expectTypeOf(day.$props["onUpdate:value"]).toEqualTypeOf<
        ((value: string | null) => void) | undefined
      >()
      const several = new Calendar.Root({ mode: "multiple" })
      expectTypeOf(several.$props["onUpdate:value"]).toEqualTypeOf<
        ((value: readonly string[]) => void) | undefined
      >()
      const stay = new Calendar.Root({ mode: "range" })
      expectTypeOf(stay.$props.onValueChange).toEqualTypeOf<
        ((value: DateRange | null, details: ChangeDetails) => void) | undefined
      >()
      // @ts-expect-error a day where the mode chooses several
      new Calendar.Root({ mode: "multiple", value: "2026-03-02" })
      // Base UI's shape: with `multiple`, the value and what its change tells are a list.
      const basket = new Select.Root({ multiple: true, value: ["apple"] })
      expectTypeOf(basket.$props["onUpdate:value"]).toEqualTypeOf<
        ((value: string[]) => void) | undefined
      >()
      const one = new Select.Root({ value: "apple" })
      expectTypeOf(one.$props["onUpdate:value"]).toEqualTypeOf<
        ((value: string | null) => void) | undefined
      >()
      // @ts-expect-error one value where `multiple` holds a list
      new Select.Root({ multiple: true, value: "apple" })
    }
    expectTypeOf(check).toBeFunction()
  })

  it("is what `partComponent` returns, for the tag and the state it is told", () => {
    const check = () => {
      const Star = partComponent<"button", { readonly filled?: true | undefined }>(
        "Star",
        "button",
        () => ({
          props: { peek: () => ({}), get: () => ({}), subscribe: () => () => {} },
          attach: () => () => {},
        })
      )
      expectTypeOf(Star).toEqualTypeOf<
        PartComponent<"button", { readonly filled?: true | undefined }>
      >()
    }
    expectTypeOf(check).toBeFunction()
  })
})
