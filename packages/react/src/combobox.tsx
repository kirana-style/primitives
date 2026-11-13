import { defined, within } from "@kirana-ui/core"
import type { PositionOptions } from "@kirana-ui/core"
import { createCombobox } from "@kirana-ui/core/combobox"
import type { Combobox as Controller, ComboboxProps } from "@kirana-ui/core/combobox"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { FieldContext } from "./field-context.ts"
import { Portal as BodyPortal, useController, useOptions, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<unknown>(undefined)

function useCombobox(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Combobox.${part}> must be inside <Combobox.Root>`)
  return controller
}

export type RootProps<Value> = Omit<ComboboxProps<Value>, "id"> & {
  id?: string
  children?: ReactNode
}

function Root<Value>({ children, ...props }: RootProps<Value>): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller = useController<ComboboxProps<Value>, Controller<Value>>(
    within(createCombobox<Value>, { field }),
    props
  ) as unknown as Controller
  const named = useSignal(controller.named)
  return (
    <Context.Provider value={controller}>
      {children}
      {named ? <HiddenInput /> : null}
    </Context.Provider>
  )
}

const HiddenInput = () => usePart(useCombobox("Root").hidden, "input", {})
const Input = (props: PartComponentProps) => usePart(useCombobox("Input").input, "input", props)
const Trigger = (props: PartComponentProps) =>
  usePart(useCombobox("Trigger").trigger, "button", props)
const Popup = (props: PartComponentProps) => usePart(useCombobox("Popup").popup, "div", props)

function Portal({ children }: { children?: ReactNode }): ReactElement | null {
  const mounted = useSignal(useCombobox("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type PositionerProps = PartComponentProps & Partial<PositionOptions>

function Positioner({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  ...props
}: PositionerProps) {
  const controller = useCombobox("Positioner")
  controller.positioning.set(defined({ side, align, sideOffset, alignOffset, collisionPadding }))
  return usePart(controller.positioner, "div", props)
}

export interface ItemProps extends PartComponentProps {
  value: unknown
  disabled?: boolean
  /** What is filtered and what the input shows; the item's text when left out. */
  label?: string
  id?: string
  /** Its place among all the rows, in a virtualized list. */
  index?: number
}

function Item({ value, disabled, label, id, index, ...props }: ItemProps): ReactElement {
  const controller = useCombobox("Item")
  const generated = useId()
  const options = useOptions({ disabled, label, index, id: id ?? generated })
  const part = useMemo(
    () => controller.item(value, () => options.get()),
    [controller, value, options]
  )
  return <ItemContext.Provider value={value}>{usePart(part, "div", props)}</ItemContext.Provider>
}

export interface ItemIndicatorProps extends PartComponentProps {
  keepMounted?: boolean
}

function ItemIndicator({ keepMounted, render: _render, ref: _ref, ...rest }: ItemIndicatorProps) {
  const selected = useSignal(useCombobox("ItemIndicator").selected(useContext(ItemContext)))
  if (!selected && !keepMounted) return null
  return <span aria-hidden="true" {...(rest as object)} />
}

const ClearElement = (props: PartComponentProps) =>
  usePart(useCombobox("Clear").clear, "button", props)

/** A button that empties the input and the value. Drawn while there is something to clear. */
function Clear({ keepMounted, ...props }: ItemIndicatorProps): ReactElement | null {
  const clearable = useSignal(useCombobox("Clear").clearable)
  return clearable || keepMounted ? <ClearElement {...props} /> : null
}

const EmptyElement = (props: PartComponentProps) =>
  usePart(useCombobox("Empty").emptyPart, "div", props)

/** Drawn while no item is shown for what was typed. */
function Empty(props: PartComponentProps): ReactElement | null {
  const empty = useSignal(useCombobox("Empty").empty)
  return empty ? <EmptyElement {...props} /> : null
}

export const Combobox = {
  Root,
  Input,
  Trigger,
  Clear,
  Portal,
  Positioner,
  Popup,
  Item,
  ItemIndicator,
  Empty,
}
