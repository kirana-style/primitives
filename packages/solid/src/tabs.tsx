import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createTabs } from "@kirana-ui/core/tabs"
import type { Tabs as Controller, TabsProps } from "@kirana-ui/core/tabs"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
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

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["tabs"]

const Context = createContext<Controller>()

function useTabs(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Tabs part must be inside <Tabs.Root>")
  return made
}

/** `Value` is what a tab's `value` is: the root's `value` holds the active one's. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<TabsProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>(props: RootProps<Value>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "orientation",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext)
  const made = controller(within(createTabs<Value>, { direction }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    orientation: local.orientation,
    onValueChange: (value: Value, details: ChangeDetails) => local.onValueChange?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type ListProps = PartComponentProps<
  "div",
  StateOf<Parts["list"]>,
  { activateOnFocus?: boolean; loop?: boolean }
>

function List(props: ListProps): JSX.Element {
  const [local, rest] = splitProps(props, ["activateOnFocus", "loop"])
  const made = useTabs()
  createComputed(() => made.listOptions.set(defined({ ...local })))
  return <Part of={made.list} tag="div" {...rest} />
}

export type TabProps = PartComponentProps<
  "button",
  StateOf<Parts["tab"]>,
  { value: unknown; disabled?: boolean }
>

function Tab(props: TabProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "disabled"])
  const options = toSignal(() => ({ disabled: local.disabled }))
  // A tab is its value for as long as it is in the page.
  const part = useTabs().tab(
    untrack(() => local.value),
    () => defined(options.get())
  )
  return <Part of={part} tag="button" {...rest} />
}

export type IndicatorProps = PartComponentProps<"span", StateOf<Parts["indicator"]>>

const Indicator = (props: IndicatorProps) => <Part of={useTabs().indicator} tag="span" {...props} />

export type PanelProps = PartComponentProps<
  "div",
  StateOf<Parts["panel"]>,
  { value: unknown; keepMounted?: boolean }
>

/** `keepMounted` keeps the panel in the page, `hidden`, while its tab is not the active one. */
function Panel(props: PanelProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "keepMounted"])
  const panel = useTabs().panel(untrack(() => local.value))
  onMount(() => onCleanup(panel.mount()))
  const mounted = fromSignal(panel.mounted)
  return (
    <Show when={mounted() || local.keepMounted}>
      <Part of={panel.part} tag="div" {...rest} />
    </Show>
  )
}

export const Tabs = { Root, List, Tab, Indicator, Panel }
