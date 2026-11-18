import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createCollapsible } from "@kirana-ui/core/collapsible"
import type { Collapsible as Controller } from "@kirana-ui/core/collapsible"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["collapsible"]

const Context = createContext<Controller>()

function useCollapsible(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Collapsible part must be inside <Collapsible.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean, details: ChangeDetails) => void
    disabled?: boolean
    id?: string
  }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, ["open", "defaultOpen", "onOpenChange", "disabled", "id"])
  const generated = createUniqueId()
  const made = controller(createCollapsible, () => ({
    id: local.id ?? generated,
    open: local.open,
    defaultOpen: local.defaultOpen,
    disabled: local.disabled,
    onOpenChange: (open: boolean, details: ChangeDetails) => local.onOpenChange?.(open, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>

const Trigger = (props: TriggerProps) => (
  <Part of={useCollapsible().trigger} tag="button" {...props} />
)

export type PanelProps = PartComponentProps<
  "div",
  StateOf<Parts["panel"]>,
  { keepMounted?: boolean }
>

/** `keepMounted` keeps the closed panel in the page, `hidden`. */
function Panel(props: PanelProps): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useCollapsible()
  const mounted = fromSignal(made.mounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part of={made.panel} tag="div" {...rest} />
    </Show>
  )
}

export const Collapsible = { Root, Trigger, Panel }
