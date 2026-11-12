import { createSeparator } from "@kirana-ui/core/separator"
import type { SeparatorProps as CoreProps } from "@kirana-ui/core/separator"
import type { ReactElement } from "react"

import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type SeparatorProps = CoreProps & PartComponentProps

export function Separator({ orientation, ...rest }: SeparatorProps): ReactElement {
  const controller = useController(createSeparator, { orientation })
  return usePart(controller.root, "div", rest)
}
