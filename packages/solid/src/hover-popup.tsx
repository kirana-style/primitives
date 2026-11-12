import type { ChangeDetails, ReadonlySignal } from "@kirana-ui/core"
import type { HoverPopup, HoverPopupProps } from "@kirana-ui/core/tooltip"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { positioned } from "./popover.tsx"
import type { PositionerProps } from "./popover.tsx"
import { Part, Portal as BodyPortal, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type RootProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ChangeDetails) => void
  delay?: number
  closeDelay?: number
  disabled?: boolean
  id?: string
  children?: JSX.Element
}

/** The parts of a popup the pointer opens: a tooltip's, a hover card's. */
export function hoverPopup(
  name: string,
  create: (props: ReadonlySignal<HoverPopupProps>) => HoverPopup,
  triggerTag: string
) {
  const Context = createContext<HoverPopup>()

  function use(): HoverPopup {
    const made = useContext(Context)
    if (!made) throw new Error(`A ${name} part must be inside <${name}.Root>`)
    return made
  }

  function Root(props: RootProps): JSX.Element {
    const generated = createUniqueId()
    const made = controller(create, () => ({
      id: props.id ?? generated,
      open: props.open,
      defaultOpen: props.defaultOpen,
      delay: props.delay,
      closeDelay: props.closeDelay,
      disabled: props.disabled,
      onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
    }))
    return <Context.Provider value={made}>{props.children}</Context.Provider>
  }

  const Portal = (props: { children?: JSX.Element }) => (
    <BodyPortal mounted={use().mounted}>{props.children}</BodyPortal>
  )

  function Positioner(props: PositionerProps): JSX.Element {
    const made = use()
    return <Part part={made.positioner} tag="div" {...positioned(props, made.positioning)} />
  }

  const part = (key: "trigger" | "popup" | "arrow", tag: string) => (props: PartComponentProps) => (
    <Part part={use()[key]} tag={tag} {...props} />
  )

  return {
    Root,
    Portal,
    Positioner,
    Trigger: part("trigger", triggerTag),
    Popup: part("popup", "div"),
    Arrow: part("arrow", "div"),
  }
}
