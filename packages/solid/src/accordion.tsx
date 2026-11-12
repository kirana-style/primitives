import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createAccordion } from "@kirana-ui/core/accordion"
import type { AccordionItem, Accordion as Controller } from "@kirana-ui/core/accordion"
import {
  Show,
  createContext,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  untrack,
  useContext,
} from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const ItemContext = createContext<AccordionItem>()

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

export type RootProps = PartComponentProps & {
  value?: readonly unknown[]
  defaultValue?: readonly unknown[]
  onValueChange?: (value: unknown[], details: ChangeDetails) => void
  multiple?: boolean
  disabled?: boolean
  orientation?: Orientation
  loop?: boolean
  id?: string
}

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "multiple",
    "disabled",
    "orientation",
    "loop",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(createAccordion, () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    multiple: local.multiple,
    disabled: local.disabled,
    orientation: local.orientation,
    loop: local.loop,
    onValueChange: (value: unknown[], details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

function Item(props: PartComponentProps & { value: unknown; disabled?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled"])
  const options = toSignal(() => ({ disabled: local.disabled }))
  // An item is its value for as long as it is in the page.
  const item = useAccordion().item(
    untrack(() => local.value),
    () => defined(options.get())
  )
  onMount(() => onCleanup(item.mount()))
  return (
    <ItemContext.Provider value={item}>
      <Part part={item.root} tag="div" {...rest} />
    </ItemContext.Provider>
  )
}

const Header = (props: PartComponentProps) => <Part part={useItem().header} tag="h3" {...props} />
const Trigger = (props: PartComponentProps) => (
  <Part part={useItem().trigger} tag="button" {...props} />
)

/** `keepMounted` keeps the closed panel in the page, `hidden`. */
function Panel(props: PartComponentProps & { keepMounted?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const item = useItem()
  const mounted = fromSignal(item.mounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part part={item.panel} tag="div" {...rest} />
    </Show>
  )
}

export const Accordion = { Root, Item, Header, Trigger, Panel }
