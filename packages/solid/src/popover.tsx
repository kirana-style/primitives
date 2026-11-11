import { defined } from "@kirana-ui/core"
import type { ChangeDetails, PositionOptions, Signal } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type { Popover as Controller } from "@kirana-ui/core/popover"
import { createComputed, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, Portal as BodyPortal, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function usePopover(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Popover part must be inside <Popover.Root>")
  return made
}

export type RootProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ChangeDetails) => void
  id?: string
  children?: JSX.Element
}

function Root(props: RootProps): JSX.Element {
  const generated = createUniqueId()
  const made = controller(createPopover, () => ({
    id: props.id ?? generated,
    open: props.open,
    defaultOpen: props.defaultOpen,
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return <Context.Provider value={made}>{props.children}</Context.Provider>
}

const Portal = (props: { children?: JSX.Element }) => (
  <BodyPortal mounted={usePopover().mounted}>{props.children}</BodyPortal>
)

export type PositionerProps = PartComponentProps & Partial<PositionOptions>

/** A positioner's own props, written where its placement reads them, before its element attaches. */
export function positioned<P extends PositionerProps>(
  props: P,
  positioning: Signal<Partial<PositionOptions>>
) {
  const [local, rest] = splitProps(props, [
    "side",
    "align",
    "sideOffset",
    "alignOffset",
    "collisionPadding",
  ])
  createComputed(() => positioning.set(defined({ ...local })))
  return rest as PartComponentProps
}

function Positioner(props: PositionerProps): JSX.Element {
  const made = usePopover()
  return <Part part={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

const part =
  (name: "trigger" | "popup" | "title" | "description" | "close", tag: string) =>
  (props: PartComponentProps) => <Part part={usePopover()[name]} tag={tag} {...props} />

export const Popover = {
  Root,
  Portal,
  Positioner,
  Trigger: part("trigger", "button"),
  Popup: part("popup", "div"),
  Title: part("title", "h2"),
  Description: part("description", "p"),
  Close: part("close", "button"),
}
