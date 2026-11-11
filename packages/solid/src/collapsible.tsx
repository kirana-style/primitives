import type { ChangeDetails } from "@kirana-ui/core"
import { createCollapsible } from "@kirana-ui/core/collapsible"
import type { Collapsible as Controller } from "@kirana-ui/core/collapsible"
import { Show, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useCollapsible(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Collapsible part must be inside <Collapsible.Root>")
  return made
}

export type RootProps = PartComponentProps & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ChangeDetails) => void
  disabled?: boolean
  id?: string
}

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
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

const Trigger = (props: PartComponentProps) => (
  <Part part={useCollapsible().trigger} tag="button" {...props} />
)

/** `keepMounted` keeps the closed panel in the page, `hidden`. */
function Panel(props: PartComponentProps & { keepMounted?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["keepMounted"])
  const made = useCollapsible()
  const mounted = fromSignal(made.mounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part part={made.panel} tag="div" {...rest} />
    </Show>
  )
}

export const Collapsible = { Root, Trigger, Panel }
