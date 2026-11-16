import type { ChangeDetails, ReadonlySignal } from "@kirana-ui/core"
import type { HoverPopup, HoverPopupProps } from "@kirana-ui/core/tooltip"
import { defined } from "@kirana-ui/core"
import { createComputed, createContext, createUniqueId, splitProps, useContext } from "solid-js"
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

  const part = (key: "popup" | "arrow", tag: string) => (props: PartComponentProps) => (
    <Part part={use()[key]} tag={tag} {...props} />
  )

  /** `delay` and `closeDelay` here come before the root's. */
  function Trigger(
    props: PartComponentProps & { delay?: number; closeDelay?: number }
  ): JSX.Element {
    const [local, rest] = splitProps(props, ["delay", "closeDelay"])
    const made = use()
    createComputed(() => made.timing.set(defined({ ...local })))
    return <Part part={made.trigger} tag={triggerTag} {...rest} />
  }

  return {
    Root,
    Portal,
    Positioner,
    Trigger,
    Popup: part("popup", "div"),
    Arrow: part("arrow", "div"),
  }
}
