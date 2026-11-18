import type { AccordionItemOptions, AccordionProps } from "@kirana-ui/core/accordion"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

/** `Value` is what an item's `value` is: read from `value`, `defaultValue` or `onValueChange`. */
export type RootProps<Value = unknown> = PartAttributes<
  "div",
  StateFor<"accordion", "root">,
  Controlled<AccordionProps<Value>>
>

export type ItemProps = PartAttributes<
  "div",
  StateFor<"accordion", "item">,
  AccordionItemOptions & {
    /** What tells this item from the others; an item that is given none makes its own. */
    value?: unknown
  }
>

export type HeaderProps = PartAttributes<"h3", StateFor<"accordion", "header">>

export type TriggerProps = PartAttributes<"button", StateFor<"accordion", "trigger">>

export type PanelProps = PartAttributes<
  "div",
  StateFor<"accordion", "panel">,
  {
    /** Keeps the closed panel in the page, `hidden`. */
    keepMounted?: boolean | undefined
  }
>
