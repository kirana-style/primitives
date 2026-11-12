import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createTabs } from "@kirana-ui/core/tabs"
import type { Tabs as Controller } from "@kirana-ui/core/tabs"
import {
  Show,
  createComputed,
  createContext,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  untrack,
  useContext,
} from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useTabs(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Tabs part must be inside <Tabs.Root>")
  return made
}

export type RootProps = PartComponentProps & {
  value?: unknown
  defaultValue?: unknown
  onValueChange?: (value: unknown, details: ChangeDetails) => void
  orientation?: Orientation
  id?: string
}

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "orientation",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(createTabs, () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    orientation: local.orientation,
    onValueChange: (value: unknown, details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

function List(
  props: PartComponentProps & { activateOnFocus?: boolean; loop?: boolean }
): JSX.Element {
  const [local, rest] = splitProps(props, ["activateOnFocus", "loop"])
  const made = useTabs()
  createComputed(() => made.listOptions.set(defined({ ...local })))
  return <Part part={made.list} tag="div" {...rest} />
}

function Tab(props: PartComponentProps & { value: unknown; disabled?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled"])
  const options = toSignal(() => ({ disabled: local.disabled }))
  // A tab is its value for as long as it is in the page.
  const part = useTabs().tab(
    untrack(() => local.value),
    () => defined(options.get())
  )
  return <Part part={part} tag="button" {...rest} />
}

const Indicator = (props: PartComponentProps) => (
  <Part part={useTabs().indicator} tag="span" {...props} />
)

/** `keepMounted` keeps the panel in the page, `hidden`, while its tab is not the active one. */
function Panel(props: PartComponentProps & { value: unknown; keepMounted?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "keepMounted"])
  const panel = useTabs().panel(untrack(() => local.value))
  onMount(() => onCleanup(panel.mount()))
  const mounted = fromSignal(panel.mounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part part={panel.part} tag="div" {...rest} />
    </Show>
  )
}

export const Tabs = { Root, List, Tab, Indicator, Panel }
