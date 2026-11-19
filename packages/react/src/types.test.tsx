import type { StateOf } from "@kirana-ui/core"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { useRef, useState } from "react"
import type { ComponentProps, MouseEvent, ReactElement, Ref } from "react"
import { describe, expect, expectTypeOf, it } from "vite-plus/test"

import type { PanelProps as AccordionPanelProps } from "./accordion.tsx"
import type { RootProps as CheckboxRootProps } from "./checkbox.tsx"
import type { PopupProps, TriggerProps } from "./dialog.tsx"
import type { PopupProps as DrawerPopupProps } from "./drawer.tsx"
import * as all from "./index.ts"
import type { DateRange } from "./index.ts"
import {
  Accordion,
  Calendar,
  Checkbox,
  Combobox,
  ContextMenu,
  Dialog,
  Drawer,
  HoverCard,
  Listbox,
  Menu,
  NavigationMenu,
  Popover,
  QrCode,
  RadioGroup,
  Slider,
  Select,
  Tabs,
  ToggleGroup,
  Tooltip,
} from "./index.ts"
import type { PartComponentProps, PartEvent, RenderProp } from "./runtime.tsx"
import { useRender } from "./use-render.tsx"
import type { TriggerProps as TooltipTriggerProps } from "./tooltip.tsx"

// A component of the caller's own, which a part is drawn as.
const Link = (props: { to: string; className?: string }) => <a href={props.to} {...props} />

// What follows is read by the type checker (`vp check`); nothing here is run.
export function Typed(): ReactElement {
  const button = useRef<HTMLButtonElement>(null)
  const div = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const [position, setPosition] = useState("bottom")
  const [open, setOpen] = useState<string[]>([])
  const [tab, setTab] = useState("a")
  const [fruit, setFruit] = useState<string | null>(null)
  const [fruits, setFruits] = useState<string[]>([])
  const [radio, setRadio] = useState<string | null>("a")
  const [level, setLevel] = useState(40)
  const [range, setRange] = useState([20, 80])
  return (
    <>
      {/* A part's props are its element's: its events, on that element. */}
      <Checkbox.Root
        onClick={(event) => {
          expectTypeOf(event).toExtend<MouseEvent<HTMLSpanElement>>()
          expectTypeOf(event.currentTarget).toEqualTypeOf<EventTarget & HTMLSpanElement>()
          event.preventDefault()
          event.preventKiranaHandler()
        }}
      />
      {/* @ts-expect-error a class is text */}
      <Dialog.Trigger className={42} />
      {/* @ts-expect-error `aria-pressed` is true, false or "mixed" */}
      <Dialog.Trigger aria-pressed="maybe" />
      <Dialog.Trigger data-slot="trigger" data-count={3} aria-pressed="mixed" type="submit" />
      {/* @ts-expect-error a div has no `href` */}
      <Dialog.Popup href="/" />
      <HoverCard.Trigger href="/profile" />
      {/* @ts-expect-error a tooltip's trigger is a button: it has no `href` */}
      <Tooltip.Trigger href="/profile" />

      {/* A ref is to the element the part draws. */}
      <Dialog.Trigger ref={button} />
      <Dialog.Popup ref={div} />
      <QrCode.Frame ref={svg} />
      <Dialog.Trigger
        ref={(element) => {
          expectTypeOf(element).toEqualTypeOf<HTMLButtonElement | null>()
        }}
      />
      {/* @ts-expect-error a trigger is a button, not a div */}
      <Dialog.Trigger ref={div} />
      {/* @ts-expect-error a popup is a div, not a button */}
      <Dialog.Popup ref={button} />

      {/* `render`: an element, a component of the caller's, a function given the part's state. */}
      <Dialog.Trigger render={<a href="/" />} />
      <Dialog.Trigger render={<Link to="/" />} />
      <Dialog.Trigger
        render={(props, state) => {
          expectTypeOf(state.popupOpen).toEqualTypeOf<true | undefined>()
          expectTypeOf(props.className).toEqualTypeOf<string | undefined>()
          // @ts-expect-error a trigger has no such state
          void state.side
          return <a {...props} />
        }}
      />
      <Popover.Positioner
        side="top"
        render={(props, state) => {
          expectTypeOf(state.open).toEqualTypeOf<true | undefined>()
          expectTypeOf(state.side).toEqualTypeOf<
            "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end" | undefined
          >()
          expectTypeOf(state.align).toEqualTypeOf<"start" | "center" | "end" | undefined>()
          return <div {...props} />
        }}
      />
      <Drawer.Popup
        render={(props, state) => {
          expectTypeOf(state.swipeDirection).toEqualTypeOf<
            "up" | "down" | "left" | "right" | undefined
          >()
          return <div {...props} />
        }}
      />
      <ContextMenu.Trigger render={(props, state) => <p {...props}>{state.popupOpen}</p>} />

      {/* A value's type is the caller's, in `value` and in what the callback is told. */}
      <Menu.RadioGroup value={position} onValueChange={setPosition} />
      <ToggleGroup value={open} onValueChange={setOpen} />
      <Accordion.Root value={open} onValueChange={setOpen} />
      <Listbox.Root value={open} onValueChange={setOpen} />
      <Tabs.Root value={tab} onValueChange={setTab} />
      <Select.Root value={fruit} onValueChange={setFruit} />
      <Select.Root multiple values={fruits} onValuesChange={setFruits} />
      <Combobox.Root value={fruit} onValueChange={setFruit} />
      <Combobox.Root multiple values={fruits} onValuesChange={setFruits} />
      <RadioGroup.Root value={radio} onValueChange={setRadio} />
      {/* A slider tells what it was given: a number, or a range's list. */}
      <Slider.Root value={level} onValueChange={setLevel} onValueCommitted={setLevel} />
      <Slider.Root value={range} onValueChange={setRange} />
      <Slider.Root
        defaultValue={40}
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<number>()}
      />
      <Slider.Root
        defaultValue={[20, 80]}
        onValueCommitted={(value) => expectTypeOf(value).toEqualTypeOf<number[]>()}
      />
      <Slider.Root onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<number>()} />
      {/* A calendar's value is its mode's: a day, a range, or a list of days. */}
      <Calendar.Root
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<string | null>()}
      />
      <Calendar.Root
        mode="range"
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<DateRange | null>()}
      />
      <Calendar.Root
        mode="multiple"
        defaultValue={["2026-03-02"]}
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<readonly string[]>()}
      />
      {/* @ts-expect-error a day where the mode chooses several */}
      <Calendar.Root mode="multiple" value="2026-03-02" />
      {/* @ts-expect-error a range's list is told where a list was given */}
      <Slider.Root value={range} onValueChange={setLevel} />
      <NavigationMenu.Root value={fruit} onValueChange={setFruit} />
      <Menu.RadioGroup
        defaultValue="bottom"
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<string>()}
      />
      <Tabs.Root
        defaultValue={1}
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<number>()}
      />
      <Accordion.Root
        defaultValue={["a"]}
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<string[]>()}
      />
      <ToggleGroup<"left" | "right">
        defaultValue={["left"]}
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<("left" | "right")[]>()}
      />
      <Select.Root
        items={[{ value: 1, label: "One" }]}
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<number | null>()}
        onValuesChange={(values) => expectTypeOf(values).toEqualTypeOf<number[]>()}
      />
      <Combobox.Root
        defaultValue="apple"
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<string | null>()}
      />
      <RadioGroup.Root
        defaultValue="a"
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<string | null>()}
      />
      {/* @ts-expect-error the value is text and the callback takes a number */}
      <Tabs.Root value={tab} onValueChange={(value: number) => void value} />
      {/* @ts-expect-error a select reset to none tells `null`, which this state cannot hold */}
      <Select.Root value={tab} onValueChange={setTab} />

      {/* A select's value part is told the root's value type when its caller names it. */}
      <Select.Value<string | null>>
        {(value, label) => {
          expectTypeOf(value).toEqualTypeOf<string | null>()
          expectTypeOf(label).toEqualTypeOf<string | undefined>()
          return label
        }}
      </Select.Value>
      <Select.Value<string[]>>
        {(values, labels) => {
          expectTypeOf(values).toEqualTypeOf<string[]>()
          expectTypeOf(labels).toEqualTypeOf<readonly string[]>()
          return labels.join()
        }}
      </Select.Value>
    </>
  )
}

// A wrapper typed from the part has the element's props and the part's own, and hands them on.
export function Mine(props: ComponentProps<typeof Checkbox.Root>): ReactElement {
  expectTypeOf(props.className).toEqualTypeOf<string | undefined>()
  expectTypeOf(props.checked).toEqualTypeOf<boolean | undefined>()
  expectTypeOf(props.ref).toEqualTypeOf<Ref<HTMLSpanElement> | undefined>()
  expectTypeOf(props.onClick).parameter(0).toEqualTypeOf<PartEvent<MouseEvent<HTMLSpanElement>>>()
  return <Checkbox.Root {...props} />
}

// A plain element of one's own through `useRender`, typed as the docs say: its state may hold
// `false`, `null` and `undefined`, which are written as absent. Its `render` is a part's, with
// the state unnamed or named.
export function Badge({
  render,
  variant,
  ...props
}: PartComponentProps<"span"> & { variant?: string | null }): ReactElement {
  return useRender({ render, defaultTagName: "span", props, state: { slot: "badge", variant } })
}

export function Marker({
  render,
  active,
  ...props
}: PartComponentProps<"li", { active: boolean; tone: string | undefined }> & {
  active?: boolean
}): ReactElement {
  const state = { active: Boolean(active), tone: undefined }
  return useRender({ render, defaultTagName: "li", props, state })
}

export function Badges(): ReactElement {
  return (
    <>
      <Badge variant={null} render={(props, state) => <b {...props}>{String(state.variant)}</b>} />
      <Marker
        render={(props, state) => {
          expectTypeOf(state.active).toEqualTypeOf<boolean>()
          return <li {...props} />
        }}
      />
    </>
  )
}

describe("a part's types", () => {
  it("are its element's props, its own over them, and a ref to its element", () => {
    expectTypeOf<ComponentProps<typeof Checkbox.Root>>().toEqualTypeOf<CheckboxRootProps>()
    expectTypeOf<ComponentProps<typeof Dialog.Trigger>>().toEqualTypeOf<TriggerProps>()
    expectTypeOf<ComponentProps<typeof Tooltip.Trigger>>().toEqualTypeOf<TooltipTriggerProps>()
    expectTypeOf<ComponentProps<typeof Drawer.Popup>>().toEqualTypeOf<DrawerPopupProps>()
    expectTypeOf<TriggerProps["ref"]>().toEqualTypeOf<Ref<HTMLButtonElement> | undefined>()
    expectTypeOf<PopupProps["ref"]>().toEqualTypeOf<Ref<HTMLDivElement> | undefined>()
    expectTypeOf<TriggerProps["type"]>().toEqualTypeOf<"submit" | "reset" | "button" | undefined>()
    // The part's own prop, not the element's of the same name.
    expectTypeOf<CheckboxRootProps["value"]>().toEqualTypeOf<string | undefined>()
    expectTypeOf<AccordionPanelProps["keepMounted"]>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<TriggerProps>().not.toHaveProperty("href")
  })

  it("tell a `render` function the part's state, from the vocabulary", () => {
    expectTypeOf<PopupProps["render"]>().toEqualTypeOf<
      RenderProp<StateOf<Vocabulary["dialog"]["popup"]>> | undefined
    >()
    expectTypeOf<DrawerPopupProps["render"]>().toEqualTypeOf<
      RenderProp<StateOf<Vocabulary["drawer"]["popup"]>> | undefined
    >()
    // With no tag and no state named, a part is a `div` whose state is any part's.
    expectTypeOf<PartComponentProps["ref"]>().toEqualTypeOf<Ref<HTMLDivElement> | undefined>()
  })
})

// A file's exported type names, declared there or handed on from another file.
function exported(file: string): Set<string> {
  const text = readFileSync(join(import.meta.dirname, file), "utf8")
  const names = new Set<string>()
  for (const [, name] of text.matchAll(/^export (?:type|interface) (\w+)/gm)) names.add(name!)
  for (const [, list] of text.matchAll(/^export type \{([^}]*)\}/gm)) {
    for (const each of list!.split(",")) {
      const name = each
        .trim()
        .split(/\s+as\s+/)
        .pop()
      if (name) names.add(name)
    }
  }
  return names
}

describe("every part's props type", () => {
  const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
  const files = new Set(readdirSync(import.meta.dirname))
  const components = Object.entries(all as Record<string, unknown>).filter(
    ([name, value]) =>
      /^[A-Z]/.test(name) &&
      !["DirectionProvider", "PortalProvider"].includes(name) &&
      (typeof value === "object" || typeof value === "function")
  )

  it("is exported by name from the component's entry", () => {
    expect(components.length).toBeGreaterThan(45)
    const missing: string[] = []
    for (const [name, value] of components) {
      const file = [`${kebab(name)}.tsx`, `${kebab(name)}.ts`].find((each) => files.has(each))
      if (!file) {
        missing.push(`${name}: no entry`)
        continue
      }
      const names = exported(file)
      // A component with one part is the component: `ButtonProps`. With several: `TriggerProps`.
      const wanted =
        typeof value === "function"
          ? [`${name}Props`]
          : Object.keys(value as object).map((part) => `${part}Props`)
      for (const each of wanted) if (!names.has(each)) missing.push(`${file}: ${each}`)
    }
    expect(missing).toEqual([])
  })
})
