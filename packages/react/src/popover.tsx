import { defined } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type {
  Popover as Controller,
  PopoverProps,
  PopoverTriggerOptions,
} from "@kirana-ui/core/popover"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
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
import type { PartComponentProps, PortalProps, PositionerOptions } from "./runtime.tsx"

export type { PortalProps }

type Parts = Vocabulary["popover"]

/**
 * The popover its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the popover's parts).
 */
const Context = createContext<Controller | null>(null)
/** For a component made of this one's parts: a date picker. */
export { Context as PopoverContext }

function usePopover(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Popover.${part}> must be inside <Popover.Root>`)
  return controller
}

export type RootProps = Omit<PopoverProps, "id"> & { id?: string; children?: ReactNode }

function Root({ children, ...props }: RootProps): ReactElement {
  const controller = useController(createPopover, props)
  return <Context.Provider value={controller}>{children}</Context.Provider>
}

function Portal({ children }: PortalProps): ReactElement | null {
  const mounted = useSignal(usePopover("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

function Positioner(props: PositionerProps): ReactElement {
  const controller = usePopover("Positioner")
  return usePart(controller.positioner, "div", usePositioning(controller.positioning, props))
}

/** What a trigger takes of its own: whether the pointer opens the popover too, and its waits. */
export type TriggerOptions = PopoverTriggerOptions

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>, TriggerOptions>
export type BackdropProps = PartComponentProps<"div", StateOf<Parts["backdrop"]>>
export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type TitleProps = PartComponentProps<"h2", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>>

function Trigger({ openOnHover, delay, closeDelay, ...props }: TriggerProps): ReactElement {
  const controller = usePopover("Trigger")
  // Written while rendering, as a positioner's are: nothing re-renders for it.
  controller.hovering.set(defined({ openOnHover, delay, closeDelay }))
  return usePart(controller.trigger, "button", props)
}
const Backdrop = (props: BackdropProps) => usePart(usePopover("Backdrop").backdrop, "div", props)
const Arrow = (props: ArrowProps) => usePart(usePopover("Arrow").arrow, "div", props)
const Popup = (props: PopupProps) => usePart(usePopover("Popup").popup, "div", props)
const Title = (props: TitleProps) => usePart(usePopover("Title").title, "h2", props)
const Description = (props: DescriptionProps) =>
  usePart(usePopover("Description").description, "p", props)
const Close = (props: CloseProps) => usePart(usePopover("Close").close, "button", props)

export const Popover = /* @__PURE__ */ parts("Popover", {
  Root,
  Trigger,
  Portal,
  Backdrop,
  Positioner,
  Popup,
  Arrow,
  Title,
  Description,
  Close,
})
