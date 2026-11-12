import type { Orientation } from "@kirana-ui/core"
import { createSeparator } from "@kirana-ui/core/separator"
import { splitProps } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export function Separator(props: PartComponentProps & { orientation?: Orientation }): JSX.Element {
  const [local, rest] = splitProps(props, ["orientation"])
  const made = controller(createSeparator, () => ({ orientation: local.orientation }))
  return <Part part={made.root} tag="div" {...rest} />
}
