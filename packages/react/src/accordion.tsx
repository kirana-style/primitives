import { defined, within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createAccordion } from "@kirana-ui/core/accordion"
import type {
  AccordionItem,
  AccordionProps,
  Accordion as Controller,
} from "@kirana-ui/core/accordion"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import {
  PartElement,
  parts,
  useController,
  useMount,
  useOptions,
  usePart,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["accordion"]

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<AccordionItem | null>(null)

function useAccordion(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Accordion.${part}> must be inside <Accordion.Root>`)
  return controller
}

function useItem(part: string): AccordionItem {
  const item = useContext(ItemContext)
  if (!item) throw new Error(`<Accordion.${part}> must be inside <Accordion.Item>`)
  return item
}

/** `Value` is what tells an item from the others: the type of `value`'s entries. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<AccordionProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>({
  value,
  defaultValue,
  onValueChange,
  multiple,
  disabled,
  orientation,
  loop,
  loopFocus,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createAccordion<Value>, { direction })
  const controller: Controller = useController(create, {
    value,
    defaultValue,
    onValueChange,
    multiple,
    disabled,
    orientation,
    loop,
    loopFocus,
    id,
  })
  return (
    <Context.Provider value={controller}>
      <PartElement of={controller.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    /**
     * What tells this item from the others: it is in the accordion's `value` while the item is
     * open. An item that is given none makes its own.
     */
    value?: unknown
    /** Disables this item: it cannot be opened or closed. */
    disabled?: boolean
  }
>

function Item({ value, disabled, ...rest }: ItemProps): ReactElement {
  const controller = useAccordion("Item")
  const options = useOptions({ disabled })
  const generated = useId()
  const key = value === undefined ? generated : value
  const item = useMemo(
    () => controller.item(key, () => defined(options.get())),
    [controller, key, options]
  )
  useMount(item)
  return (
    <ItemContext.Provider value={item}>
      <PartElement of={item.root} tag="div" {...rest} />
    </ItemContext.Provider>
  )
}

export type HeaderProps = PartComponentProps<"h3", StateOf<Parts["header"]>>
export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>

const Header = (props: HeaderProps) => usePart(useItem("Header").header, "h3", props)
const Trigger = (props: TriggerProps) => usePart(useItem("Trigger").trigger, "button", props)

export type PanelProps = PartComponentProps<
  "div",
  StateOf<Parts["panel"]>,
  {
    /** Keeps the closed panel in the page, `hidden`. */
    keepMounted?: boolean
  }
>

function Panel({ keepMounted, ...props }: PanelProps): ReactElement | null {
  const item = useItem("Panel")
  const mounted = useSignal(item.mounted)
  if (!mounted && !keepMounted) return null
  return <PartElement of={item.panel} tag="div" {...props} />
}

export const Accordion = /* @__PURE__ */ parts("Accordion", { Root, Item, Header, Trigger, Panel })
