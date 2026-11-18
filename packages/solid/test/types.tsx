// What a caller's editor knows of a part: its element's props, its own, its value's type and
// its state. Never run: the package's own `tsconfig.json` checks it (`vp check`, or
// `tsc -p packages/solid`), and a `@ts-expect-error` line fails once what it refuses is taken.
import type { StateOf } from "@kirana-ui/core"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createSignal, splitProps } from "solid-js"
import type { Accessor, ComponentProps, JSX } from "solid-js"
import { expectTypeOf } from "vite-plus/test"

import { Accordion } from "../src/accordion.tsx"
import { Checkbox } from "../src/checkbox.tsx"
import type { IndicatorProps, RootProps as CheckboxRootProps } from "../src/checkbox.tsx"
import { Combobox } from "../src/combobox.tsx"
import { Dialog, Drawer } from "../src/dialog.tsx"
import type { PopupProps, TriggerProps } from "../src/dialog.tsx"
import type { RootProps as DrawerRootProps } from "../src/drawer.ts"
import { Command, ContextMenu, Menu, Menubar, NavigationMenu, Tabs } from "../src/index.ts"
import type { PartComponentProps } from "../src/index.ts"
import { Listbox } from "../src/listbox.tsx"
import { Meter } from "../src/meter.tsx"
import { Progress } from "../src/progress.tsx"
import { QrCode } from "../src/qr-code.tsx"
import { RadioGroup } from "../src/radio-group.tsx"
import { Select } from "../src/select.tsx"
import { Slider } from "../src/slider.tsx"
import { Toggle } from "../src/toggle.tsx"
import { ToggleGroup } from "../src/toggle-group.tsx"

/** A part's props are its element's. */
export function elements(button: HTMLButtonElement, division: HTMLDivElement): JSX.Element {
  return (
    <>
      <Checkbox.Root
        onClick={(event) => {
          event.preventDefault()
          expectTypeOf(event).toExtend<MouseEvent>()
          expectTypeOf(event.currentTarget).toExtend<HTMLSpanElement>()
          expectTypeOf(event.currentTarget.dataset).toEqualTypeOf<DOMStringMap>()
          // Keeps the part's own handler out of this press.
          expectTypeOf(event.preventKiranaHandler).toEqualTypeOf<() => void>()
        }}
        onKeyDown={(event) => expectTypeOf(event.key).toBeString()}
      />
      <Dialog.Root>
        <Dialog.Trigger
          data-testid="open"
          classList={{ wide: true }}
          on:click={(event) => expectTypeOf(event.currentTarget).toExtend<HTMLButtonElement>()}
          type="submit"
          ref={(element) => expectTypeOf(element).toEqualTypeOf<HTMLButtonElement>()}
        />
        <Dialog.Trigger ref={button} />
        {/* The element's own `part` attribute, for `::part()`. */}
        <Dialog.Trigger part="trigger" />
        {/* @ts-expect-error the `part` attribute is text */}
        <Dialog.Trigger part={42} />
        {/* @ts-expect-error a class is text */}
        <Dialog.Trigger class={42} />
        {/* @ts-expect-error a button's ref is not a div's */}
        <Dialog.Trigger ref={division} />
        <Dialog.Popup ref={(element) => expectTypeOf(element).toEqualTypeOf<HTMLDivElement>()} />
        <Dialog.Popup ref={division} />
        {/* @ts-expect-error a div's ref is not a button's */}
        <Dialog.Popup ref={button} />
        {/* @ts-expect-error a div has no `href` */}
        <Dialog.Popup href="/x" />
      </Dialog.Root>
      <QrCode.Root value="x">
        <QrCode.Frame
          viewBox="0 0 1 1"
          ref={(element) => expectTypeOf(element).toEqualTypeOf<SVGSVGElement>()}
        />
      </QrCode.Root>
      {/* A part's own prop comes before its element's of the same name. */}
      <Toggle value={{ any: "thing" }} />
      <Command.Root onSelect={(value) => expectTypeOf(value).toBeString()} />
    </>
  )
}

/** A wrapper has the element's props and the part's own, and hands the rest back. */
export function Mine(props: ComponentProps<typeof Checkbox.Root>): JSX.Element {
  expectTypeOf(props).toEqualTypeOf<CheckboxRootProps>()
  expectTypeOf(props.class).toEqualTypeOf<string | undefined>()
  expectTypeOf(props.checked).toEqualTypeOf<boolean | undefined>()
  expectTypeOf(props.tabIndex).toEqualTypeOf<number | string | undefined>()
  const [local, rest] = splitProps(props, ["class"])
  return <Checkbox.Root class={`mine ${local.class ?? ""}`} {...rest} />
}

/** Each part's props are a named export of its entry, and what `ComponentProps` gives. */
export function named(): void {
  expectTypeOf<ComponentProps<typeof Checkbox.Indicator>>().toEqualTypeOf<IndicatorProps>()
  expectTypeOf<ComponentProps<typeof Dialog.Trigger>>().toEqualTypeOf<TriggerProps>()
  expectTypeOf<ComponentProps<typeof Dialog.Popup>>().toEqualTypeOf<PopupProps>()
  expectTypeOf<ComponentProps<typeof Drawer.Root>>().toEqualTypeOf<DrawerRootProps>()
  // Every prop of the element is the part's: each `on:`, and each `prop:`, `attr:` and
  // `bool:` an application declares, and `part`, the element's own attribute. Each has the
  // element's type but a handler, whose event has `preventKiranaHandler()` too.
  expectTypeOf<
    Exclude<keyof JSX.IntrinsicElements["button"], keyof TriggerProps>
  >().toEqualTypeOf<never>()
  expectTypeOf<Pick<TriggerProps, "classList" | "style" | "part">>().toEqualTypeOf<
    Pick<JSX.IntrinsicElements["button"], "classList" | "style" | "part">
  >()
  expectTypeOf<JSX.IntrinsicElements["button"]["onClick"]>().toExtend<TriggerProps["onClick"]>()
  // With no arguments it is a `<div>`'s, with any state: what it was before it took a tag.
  expectTypeOf<PartComponentProps["ref"]>().toEqualTypeOf<
    HTMLDivElement | ((element: HTMLDivElement) => void) | undefined
  >()
}

/** `render` is handed the part's props, to spread, and its state as the vocabulary has it. */
export function rendered(): JSX.Element {
  return (
    <>
      <Checkbox.Root
        render={(props, state) => {
          expectTypeOf(state()).toEqualTypeOf<StateOf<Vocabulary["checkbox"]["root"]>>()
          expectTypeOf(state().checked).toEqualTypeOf<true | undefined>()
          // @ts-expect-error a checkbox has no `open` state
          void state().open
          return <a {...props()} href="/terms" />
        }}
      />
      <Dialog.Root>
        <Dialog.Popup
          render={(props, state) => <section {...props()}>{state().open && "Open"}</section>}
        />
      </Dialog.Root>
      <Drawer.Root>
        <Drawer.Popup
          render={(props, state) => {
            expectTypeOf(state().swipeDirection).toEqualTypeOf<
              "up" | "down" | "left" | "right" | undefined
            >()
            return <div {...props()} />
          }}
        />
        {/* @ts-expect-error a dialog's popup is not swiped: only a drawer's says so */}
        <Dialog.Popup render={(props, state) => <div {...props()}>{state().swiping}</div>} />
      </Drawer.Root>
      <Progress.Root value={1} render={(props, state) => <p {...props()}>{state().complete}</p>} />
      {/* @ts-expect-error a meter is never complete */}
      <Meter.Root value={1} render={(props, state) => <p {...props()}>{state().complete}</p>} />
    </>
  )
}

/** A root's value is the caller's: what it passes is what its callback is given. */
export function values(): JSX.Element {
  const [position, setPosition] = createSignal("bottom")
  const [pressed, setPressed] = createSignal<string[]>([])
  const [open, setOpen] = createSignal<string[]>([])
  const [fruit, setFruit] = createSignal<string | null>(null)
  const [fruits, setFruits] = createSignal<string[]>([])
  const [tab, setTab] = createSignal<"one" | "two">("one")
  const [page, setPage] = createSignal<number | null>(null)
  const [text] = createSignal("")
  const [level, setLevel] = createSignal(40)
  const [range, setRange] = createSignal([20, 80])
  return (
    <>
      <Menu.Root>
        <Menu.RadioGroup value={position()} onValueChange={setPosition} />
        <Menu.RadioGroup
          defaultValue={1}
          onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<number>()}
        />
      </Menu.Root>
      {/* A slider tells what it was given: a number, or a range's list. */}
      <Slider.Root value={level()} onValueChange={setLevel} onValueCommitted={setLevel} />
      <Slider.Root value={range()} onValueChange={setRange} />
      <Slider.Root
        defaultValue={40}
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<number>()}
      />
      <Slider.Root onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<number>()} />
      {/* @ts-expect-error a range's list is told where a list was given */}
      <Slider.Root value={range()} onValueChange={(value: number) => value} />
      <ContextMenu.Root>
        <ContextMenu.RadioGroup value={position()} onValueChange={setPosition} />
      </ContextMenu.Root>
      <Menubar>
        <Menu.Root>
          <Menu.RadioGroup value={position()} onValueChange={setPosition} />
        </Menu.Root>
      </Menubar>
      <ToggleGroup value={pressed()} onValueChange={setPressed} />
      <Accordion.Root value={open()} onValueChange={setOpen} />
      <Accordion.Root
        defaultValue={[1, 2]}
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<number[]>()}
      />
      <Listbox.Root value={fruits()} onValueChange={setFruits} />
      <Select.Root value={fruit()} onValueChange={setFruit}>
        <Select.Value<string>>
          {(value, label) => {
            expectTypeOf(value).toEqualTypeOf<Accessor<string>>()
            expectTypeOf(label).toEqualTypeOf<Accessor<string | undefined>>()
            return label()
          }}
        </Select.Value>
      </Select.Root>
      <Select.Root multiple values={fruits()} onValuesChange={setFruits}>
        <Select.Value>
          {(chosen: Accessor<string[]>, labels) => {
            expectTypeOf(labels).toEqualTypeOf<Accessor<readonly string[]>>()
            return chosen().join()
          }}
        </Select.Value>
      </Select.Root>
      <Select.Root
        defaultValue="apple"
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<string | null>()}
        onValuesChange={(chosen) => expectTypeOf(chosen).toEqualTypeOf<string[]>()}
      />
      <Combobox.Root value={fruit()} onValueChange={setFruit} />
      <Combobox.Root multiple values={fruits()} onValuesChange={setFruits} />
      <RadioGroup.Root value={fruit()} onValueChange={setFruit} />
      <Tabs.Root value={tab()} onValueChange={setTab} />
      <NavigationMenu.Root value={page()} onValueChange={setPage} />
      {/* @ts-expect-error a group of text values does not hand its value to a number's setter */}
      <RadioGroup.Root value={text()} onValueChange={setPage} />
      <RadioGroup.Root
        value={text()}
        onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<string | null>()}
      />
    </>
  )
}
