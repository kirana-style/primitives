import { defined } from "@kirana-ui/core"
import type { PositionOptions } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type { Popover as Controller, PopoverProps } from "@kirana-ui/core/popover"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { Portal as BodyPortal, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

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

function Portal({ children }: { children?: ReactNode }): ReactElement | null {
  const mounted = useSignal(usePopover("Portal").mounted)
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
  const controller = usePopover("Positioner")
  // Written while rendering, so the first placement (made when the element attaches, before
  // this component's effects) reads them. Nothing re-renders for it: the core compares.
  controller.positioning.set(defined({ side, align, sideOffset, alignOffset, collisionPadding }))
  return usePart(controller.positioner, "div", props)
}

const Trigger = (props: PartComponentProps) =>
  usePart(usePopover("Trigger").trigger, "button", props)
const Popup = (props: PartComponentProps) => usePart(usePopover("Popup").popup, "div", props)
const Title = (props: PartComponentProps) => usePart(usePopover("Title").title, "h2", props)
const Description = (props: PartComponentProps) =>
  usePart(usePopover("Description").description, "p", props)
const Close = (props: PartComponentProps) => usePart(usePopover("Close").close, "button", props)

export const Popover = { Root, Trigger, Portal, Positioner, Popup, Title, Description, Close }
