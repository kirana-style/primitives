import { defined } from "@kirana-ui/core"
import type { Part } from "@kirana-ui/core"
import { createAccordion } from "@kirana-ui/core/accordion"
import type {
  AccordionItem,
  AccordionProps,
  Accordion as Controller,
} from "@kirana-ui/core/accordion"
import { createContext, useContext, useEffect, useMemo } from "react"
import type { ReactElement } from "react"

import { useController, useOptions, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

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

export type RootProps<Value> = Omit<AccordionProps<Value>, "id"> & {
  id?: string
} & PartComponentProps

function Root<Value>({
  value,
  defaultValue,
  onValueChange,
  multiple,
  disabled,
  orientation,
  loop,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const controller = useController(createAccordion<Value>, {
    value: value as readonly Value[] | undefined,
    defaultValue: defaultValue as readonly Value[] | undefined,
    onValueChange,
    multiple,
    disabled,
    orientation,
    loop,
    id,
  }) as unknown as Controller
  return (
    <Context.Provider value={controller}>
      <PartElement part={controller.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

export interface ItemProps extends PartComponentProps {
  value: unknown
  disabled?: boolean
}

function Item({ value, disabled, ...rest }: ItemProps): ReactElement {
  const controller = useAccordion("Item")
  const options = useOptions({ disabled })
  const item = useMemo(
    () => controller.item(value, () => defined(options.get())),
    [controller, value, options]
  )
  useEffect(() => item.mount(), [item])
  return (
    <ItemContext.Provider value={item}>
      <PartElement part={item.root} tag="div" {...rest} />
    </ItemContext.Provider>
  )
}

const Header = (props: PartComponentProps) => usePart(useItem("Header").header, "h3", props)
const Trigger = (props: PartComponentProps) => usePart(useItem("Trigger").trigger, "button", props)

export interface PanelProps extends PartComponentProps {
  /** Keeps the closed panel in the page, `hidden`. */
  keepMounted?: boolean
}

function Panel({ keepMounted, ...props }: PanelProps): ReactElement | null {
  const item = useItem("Panel")
  const mounted = useSignal(item.mounted)
  if (!mounted && !keepMounted) return null
  return <PartElement part={item.panel} tag="div" {...props} />
}

export const Accordion = { Root, Item, Header, Trigger, Panel }
