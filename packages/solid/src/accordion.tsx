import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createAccordion } from "@kirana-ui/core/accordion"
import type {
  AccordionItem,
  AccordionProps,
  Accordion as Controller,
} from "@kirana-ui/core/accordion"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, createUniqueId, onSettled, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal, toSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["accordion"]

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<AccordionItem | null>(null)

function useAccordion(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("An Accordion part must be inside <Accordion.Root>")
  return made
}

function useItem(): AccordionItem {
  const item = useContext(ItemContext)
  if (!item) throw new Error("An Accordion part must be inside <Accordion.Item>")
  return item
}

/** `Value` is what tells an item from the others: what the items' `value` and the root's hold. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<AccordionProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>(props: RootProps<Value>): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "multiple",
    "disabled",
    "orientation",
    "loop",
    "loopFocus",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createAccordion<Value>, { direction }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    multiple: local.multiple,
    disabled: local.disabled,
    orientation: local.orientation,
    loop: local.loop,
    loopFocus: local.loopFocus,
    onValueChange: (value: Value[], details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  { value?: unknown; disabled?: boolean }
>

/** `value` tells this item from the others; an item that is given none makes its own. */
function Item(props: ItemProps): JSX.Element {
  const [local, rest] = split(props, ["value", "disabled"])
  const options = toSignal(() => ({ disabled: local.disabled }))
  const generated = createUniqueId()
  // An item is its value for as long as it is in the page.
  const value = untrack(() => local.value)
  const item = useAccordion().item(value === undefined ? generated : value, () =>
    defined(options.get())
  )
  onSettled(() => item.mount())
  return (
    <ItemContext value={item}>
      <Part of={item.root} tag="div" {...rest} />
    </ItemContext>
  )
}

export type HeaderProps = PartComponentProps<"h3", StateOf<Parts["header"]>>
export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>

const Header = (props: HeaderProps) => <Part of={useItem().header} tag="h3" {...props} />
const Trigger = (props: TriggerProps) => <Part of={useItem().trigger} tag="button" {...props} />

export type PanelProps = PartComponentProps<
  "div",
  StateOf<Parts["panel"]>,
  { keepMounted?: boolean }
>

/** `keepMounted` keeps the closed panel in the page, `hidden`. */
function Panel(props: PanelProps): JSX.Element {
  const [local, rest] = split(props, ["keepMounted"])
  const item = useItem()
  const mounted = fromSignal(item.mounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part of={item.panel} tag="div" {...rest} />
    </Show>
  )
}

export const Accordion = { Root, Item, Header, Trigger, Panel }
