import { createCollapsible } from "@kirana-ui/core/collapsible"
import type { Collapsible as Controller, CollapsibleProps } from "@kirana-ui/core/collapsible"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useCollapsible(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Collapsible.${part}> must be inside <Collapsible.Root>`)
  return controller
}

export type RootProps = Omit<CollapsibleProps, "id"> & { id?: string } & PartComponentProps

function Root({ open, defaultOpen, onOpenChange, disabled, id, ...rest }: RootProps): ReactElement {
  const controller = useController(createCollapsible, {
    open,
    defaultOpen,
    onOpenChange,
    disabled,
    id,
  })
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

function Trigger(props: PartComponentProps): ReactElement {
  return usePart(useCollapsible("Trigger").trigger, "button", props)
}

export interface PanelProps extends PartComponentProps {
  /** Keeps the closed panel in the page, `hidden`. */
  keepMounted?: boolean
}

function Panel({ keepMounted, ...props }: PanelProps): ReactElement | null {
  const controller = useCollapsible("Panel")
  const mounted = useSignal(controller.mounted)
  if (!mounted && !keepMounted) return null
  return <PanelElement {...props} />
}

function PanelElement(props: PartComponentProps): ReactElement {
  return usePart(useCollapsible("Panel").panel, "div", props)
}

export const Collapsible = { Root, Trigger, Panel }
