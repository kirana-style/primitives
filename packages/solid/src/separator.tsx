import type { Orientation, StateOf } from "@kirana-ui/core"
import { createSeparator } from "@kirana-ui/core/separator"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { splitProps } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type SeparatorProps = PartComponentProps<
  "div",
  StateOf<Vocabulary["separator"]["root"]>,
  { orientation?: Orientation }
>

export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["orientation"])
  const made = controller(createSeparator, () => ({ orientation: local.orientation }))
  return <Part of={made.root} tag="div" {...rest} />
}
