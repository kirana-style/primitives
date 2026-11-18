import { defined, within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createTabs } from "@kirana-ui/core/tabs"
import type { Tabs as Controller, TabsListOptions, TabsProps } from "@kirana-ui/core/tabs"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import {
  PartElement,
  parts,
  useController,
  useMount,
  useOptions,
  usePart,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["tabs"]

const Context = createContext<Controller | null>(null)

function useTabs(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Tabs.${part}> must be inside <Tabs.Root>`)
  return controller
}

/** `Value` is what tells a tab from the others: the type of `value`. */
export type RootProps<Value = unknown> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<TabsProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>({
  value,
  defaultValue,
  onValueChange,
  orientation,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createTabs<Value>, { direction })
  const controller: Controller = useController(create, {
    value,
    defaultValue,
    onValueChange,
    orientation,
    id,
  })
  return (
    <Context.Provider value={controller}>
      <PartElement of={controller.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>, TabsListOptions>

function List({ activateOnFocus, loop, ...props }: ListProps): ReactElement {
  const controller = useTabs("List")
  // Read when a key is pressed, so written while rendering: nothing re-renders for it.
  controller.listOptions.set(defined({ activateOnFocus, loop }))
  return usePart(controller.list, "div", props)
}

export type TabProps = PartComponentProps<
  "button",
  StateOf<Parts["tab"]>,
  {
    /** What the tabs' value is while this tab is the active one. */
    value: unknown
    /** Disables this tab: it cannot be chosen. */
    disabled?: boolean
  }
>

function Tab({ value, disabled, ...props }: TabProps): ReactElement {
  const controller = useTabs("Tab")
  const options = useOptions({ disabled })
  const part = useMemo(
    () => controller.tab(value, () => defined(options.get())),
    [controller, value, options]
  )
  return usePart(part, "button", props)
}

export type IndicatorProps = PartComponentProps<"span", StateOf<Parts["indicator"]>>

const Indicator = (props: IndicatorProps) => usePart(useTabs("Indicator").indicator, "span", props)

export type PanelProps = PartComponentProps<
  "div",
  StateOf<Parts["panel"]>,
  {
    /** The value of the tab this is the panel of. */
    value: unknown
    /** Keeps the panel in the page, `hidden`, while its tab is not the active one. */
    keepMounted?: boolean
  }
>

function Panel({ value, keepMounted, ...props }: PanelProps): ReactElement | null {
  const controller = useTabs("Panel")
  const panel = useMemo(() => controller.panel(value), [controller, value])
  useMount(panel)
  const mounted = useSignal(panel.mounted)
  if (!mounted && !keepMounted) return null
  return <PartElement of={panel.part} tag="div" {...props} />
}

export const Tabs = /* @__PURE__ */ parts("Tabs", { Root, List, Tab, Indicator, Panel })
