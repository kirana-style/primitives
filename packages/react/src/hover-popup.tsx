import { defined } from "@kirana-ui/core"
import type { PartState, ReadonlySignal } from "@kirana-ui/core"
import type { HoverPopup, HoverPopupProps } from "@kirana-ui/core/tooltip"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import {
  Portal as BodyPortal,
  parts,
  useController,
  usePart,
  usePositioning,
  useSignal,
} from "./runtime.tsx"
import type {
  PartComponentProps,
  PartTag,
  PortalProps,
  PositionerOptions,
  PositionerProps,
} from "./runtime.tsx"

export type { PortalProps, PositionerProps }

export type RootProps = Omit<HoverPopupProps, "id"> & { id?: string; children?: ReactNode }

/** What a trigger takes of its own: `delay` and `closeDelay` here come before the root's. */
export interface TriggerOptions {
  /** How long the pointer rests on this trigger before the popup opens, in milliseconds. */
  delay?: number
  /** How long after the pointer leaves this trigger's popup closes, in milliseconds. */
  closeDelay?: number
}

/** A trigger's props. Its element is its component's: a tooltip's `button`, a hover card's `a`. */
export type TriggerProps<Tag extends PartTag = "button", State = PartState> = PartComponentProps<
  Tag,
  State,
  TriggerOptions
>

/** The props of the parts that draw an element, as their component's entry types them. */
export interface HoverPartProps {
  Trigger: TriggerOptions
  Positioner: PositionerOptions
  Popup: object
  Arrow: object
}

/** The parts of a popup the pointer opens: a tooltip's, a hover card's. */
export function hoverPopup<Props extends HoverPartProps>(
  name: string,
  create: (props: ReadonlySignal<HoverPopupProps>) => HoverPopup,
  triggerTag: PartTag
) {
  const Context = createContext<HoverPopup | null>(null)

  function use(part: string): HoverPopup {
    const controller = useContext(Context)
    if (!controller) throw new Error(`<${name}.${part}> must be inside <${name}.Root>`)
    return controller
  }

  function Root({ children, ...props }: RootProps): ReactElement {
    const controller = useController(create, props)
    return <Context.Provider value={controller}>{children}</Context.Provider>
  }

  function Portal({ children }: PortalProps): ReactElement | null {
    const mounted = useSignal(use("Portal").mounted)
    return mounted ? <BodyPortal>{children}</BodyPortal> : null
  }

  function Positioner(props: PositionerProps): ReactElement {
    const controller = use("Positioner")
    return usePart(controller.positioner, "div", usePositioning(controller.positioning, props))
  }

  function Trigger({ delay, closeDelay, ...props }: TriggerProps<"div">): ReactElement {
    const controller = use("Trigger")
    controller.timing.set(defined({ delay, closeDelay }))
    // Typed here as any part's: the entry says which element it is.
    return usePart(controller.trigger, triggerTag as "div", props)
  }
  const Popup = (props: PartComponentProps) => usePart(use("Popup").popup, "div", props)
  const Arrow = (props: PartComponentProps) => usePart(use("Arrow").arrow, "div", props)

  return parts(name, { Root, Trigger, Portal, Positioner, Popup, Arrow }) as unknown as {
    Root: (props: RootProps) => ReactElement
    Trigger: (props: Props["Trigger"]) => ReactElement
    Portal: (props: PortalProps) => ReactElement | null
    Positioner: (props: Props["Positioner"]) => ReactElement
    Popup: (props: Props["Popup"]) => ReactElement
    Arrow: (props: Props["Arrow"]) => ReactElement
  }
}
