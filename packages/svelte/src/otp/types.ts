import type { OtpProps } from "@kirana-ui/core/otp"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<"div", StateFor<"otp", "root">, Controlled<OtpProps>>

export type InputProps = PartAttributes<"input", StateFor<"otp", "input">>

export type GroupProps = PartAttributes<"div", StateFor<"otp", "group">>

/**
 * One cell: it shows its character, then whatever it is given (a caret). With `child`, the
 * snippet is also given `char`, the cell's character, to write in the element it draws.
 */
export type SlotProps = PartAttributes<
  "div",
  StateFor<"otp", "slot">,
  {
    /** Which character of the code it shows, from 0. */
    index: number
  },
  {
    /** The cell's character; empty while it has none. */
    char: string
  }
>

/** Drawn in its cell while the cell is the active one and empty. */
export type CaretProps = PartAttributes<"div", StateFor<"otp", "caret">>

export type SeparatorProps = PartAttributes<"div", StateFor<"otp", "separator">>
