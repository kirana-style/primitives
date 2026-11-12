import { defined } from "@kirana-ui/core"
import type { PositionOptions, ReadonlySignal } from "@kirana-ui/core"
import type { HoverPopup, HoverPopupProps } from "@kirana-ui/core/tooltip"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { Portal as BodyPortal, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type RootProps = Omit<HoverPopupProps, "id"> & { id?: string; children?: ReactNode }
export type PositionerProps = PartComponentProps & Partial<PositionOptions>

/** The parts of a popup the pointer opens: a tooltip's, a hover card's. */
export function hoverPopup(
  name: string,
  create: (props: ReadonlySignal<HoverPopupProps>) => HoverPopup,
  triggerTag: string
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

  function Portal({ children }: { children?: ReactNode }): ReactElement | null {
    const mounted = useSignal(use("Portal").mounted)
    return mounted ? <BodyPortal>{children}</BodyPortal> : null
  }

  function Positioner({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    ...props
  }: PositionerProps): ReactElement {
    const controller = use("Positioner")
    // Written while rendering, so the first placement reads them. Nothing re-renders for it.
    controller.positioning.set(defined({ side, align, sideOffset, alignOffset, collisionPadding }))
    return usePart(controller.positioner, "div", props)
  }

  const Trigger = (props: PartComponentProps) => usePart(use("Trigger").trigger, triggerTag, props)
  const Popup = (props: PartComponentProps) => usePart(use("Popup").popup, "div", props)
  const Arrow = (props: PartComponentProps) => usePart(use("Arrow").arrow, "div", props)

  return { Root, Trigger, Portal, Positioner, Popup, Arrow }
}
