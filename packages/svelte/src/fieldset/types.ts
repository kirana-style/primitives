import type { FieldsetProps } from "@kirana-ui/core/fieldset"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<
  "fieldset",
  StateFor<"fieldset", "root">,
  Controlled<FieldsetProps>
>

export type LegendProps = PartAttributes<"div", StateFor<"fieldset", "legend">>
