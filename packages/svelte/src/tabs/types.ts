import type { TabOptions, TabsListOptions, TabsProps } from "@kirana-ui/core/tabs"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/** `Value` is what a tab's `value` is: read from `value`, `defaultValue` or `onValueChange`. */
export type RootProps<Value = unknown> = PartAttributes<
  "div",
  StateFor<"tabs", "root">,
  Controlled<TabsProps<Value>>
>

export type ListProps = PartAttributes<"div", StateFor<"tabs", "list">, TabsListOptions>

export type TabProps = PartAttributes<
  "button",
  StateFor<"tabs", "tab">,
  TabOptions & {
    /** What tells this tab from the others, and names its panel. */
    value: unknown
  }
>

export type IndicatorProps = PartAttributes<"span", StateFor<"tabs", "indicator">>

export type PanelProps = PartAttributes<
  "div",
  StateFor<"tabs", "panel">,
  {
    /** The value of the tab this is the panel of. */
    value: unknown
    /** Keeps the panel in the page, `hidden`, while its tab is not the active one. */
    keepMounted?: boolean | undefined
  }
>
