import type { SwitchProps } from "@kirana-ui/core/switch"

import type { Controlled, HeldInput, PartAttributes, StateFor } from "../types.ts"

/** The switch. With `child`, the snippet is also given `input`, the switch's native input. */
export type RootProps = PartAttributes<
  "span",
  StateFor<"switch", "root">,
  Controlled<SwitchProps>,
  HeldInput
>

export type ThumbProps = PartAttributes<"span", StateFor<"switch", "thumb">>
