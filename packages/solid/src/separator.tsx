import type { Orientation, StateOf } from "@kirana-ui/core"
import { createSeparator } from "@kirana-ui/core/separator"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import type { JSX } from "@solidjs/web"

import { Part, controller, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type SeparatorProps = PartComponentProps<
  "div",
  StateOf<Vocabulary["separator"]["root"]>,
  { orientation?: Orientation }
>

export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = split(props, ["orientation"])
  const made = controller(createSeparator, () => ({ orientation: local.orientation }))
  return <Part of={made.root} tag="div" {...rest} />
}
