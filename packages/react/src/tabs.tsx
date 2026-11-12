import { defined, within } from "@kirana-ui/core"
import type { Part } from "@kirana-ui/core"
import { createTabs } from "@kirana-ui/core/tabs"
import type { Tabs as Controller, TabsListOptions, TabsProps } from "@kirana-ui/core/tabs"
import { createContext, useContext, useEffect, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { useController, useOptions, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useTabs(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Tabs.${part}> must be inside <Tabs.Root>`)
  return controller
}

export type RootProps<Value> = Omit<TabsProps<Value>, "id"> & { id?: string } & PartComponentProps

function Root<Value>({
  value,
  defaultValue,
  onValueChange,
  orientation,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createTabs<Value>, { direction })
  const controller = useController(create, {
    value: value as Value | null | undefined,
    defaultValue: defaultValue as Value | null | undefined,
    onValueChange,
    orientation,
    id,
  }) as unknown as Controller
  return (
    <Context.Provider value={controller}>
      <PartElement part={controller.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

export type ListProps = PartComponentProps & TabsListOptions

function List({ activateOnFocus, loop, ...props }: ListProps): ReactElement {
  const controller = useTabs("List")
  // Read when a key is pressed, so written while rendering: nothing re-renders for it.
  controller.listOptions.set(defined({ activateOnFocus, loop }))
  return usePart(controller.list, "div", props)
}

export interface TabProps extends PartComponentProps {
  value: unknown
  disabled?: boolean
}

function Tab({ value, disabled, ...props }: TabProps): ReactElement {
  const controller = useTabs("Tab")
  const options = useOptions({ disabled })
  const part = useMemo(
    () => controller.tab(value, () => defined(options.get())),
    [controller, value, options]
  )
  return usePart(part, "button", props)
}

const Indicator = (props: PartComponentProps) =>
  usePart(useTabs("Indicator").indicator, "span", props)

export interface PanelProps extends PartComponentProps {
  value: unknown
  /** Keeps the panel in the page, `hidden`, while its tab is not the active one. */
  keepMounted?: boolean
}

function Panel({ value, keepMounted, ...props }: PanelProps): ReactElement | null {
  const controller = useTabs("Panel")
  const panel = useMemo(() => controller.panel(value), [controller, value])
  useEffect(() => panel.mount(), [panel])
  const mounted = useSignal(panel.mounted)
  if (!mounted && !keepMounted) return null
  return <PartElement part={panel.part} tag="div" {...props} />
}

export const Tabs = { Root, List, Tab, Indicator, Panel }
