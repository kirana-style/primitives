import type { StateOf } from "@kirana-ui/core"
import { createCollapsible } from "@kirana-ui/core/collapsible"
import type { Collapsible as Controller, CollapsibleProps } from "@kirana-ui/core/collapsible"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { PartElement, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["collapsible"]

const Context = createContext<Controller | null>(null)

function useCollapsible(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Collapsible.${part}> must be inside <Collapsible.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<CollapsibleProps, "id"> & { id?: string }
>

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

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>

function Trigger(props: TriggerProps): ReactElement {
  return usePart(useCollapsible("Trigger").trigger, "button", props)
}

export type PanelProps = PartComponentProps<
  "div",
  StateOf<Parts["panel"]>,
  {
    /** Keeps the closed panel in the page, `hidden`. */
    keepMounted?: boolean
  }
>

function Panel({ keepMounted, ...props }: PanelProps): ReactElement | null {
  const controller = useCollapsible("Panel")
  const mounted = useSignal(controller.mounted)
  if (!mounted && !keepMounted) return null
  return <PartElement of={controller.panel} tag="div" {...props} />
}

export const Collapsible = /* @__PURE__ */ parts("Collapsible", { Root, Trigger, Panel })
