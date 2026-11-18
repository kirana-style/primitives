import type { StateOf } from "@kirana-ui/core"
import { createSeparator } from "@kirana-ui/core/separator"
import type { SeparatorProps as CoreProps } from "@kirana-ui/core/separator"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import type { ReactElement } from "react"

import { component, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type SeparatorProps = PartComponentProps<
  "div",
  StateOf<Vocabulary["separator"]["root"]>,
  CoreProps
>

export const Separator = /* @__PURE__ */ component(
  "Separator",
  function Separator({ orientation, ...rest }: SeparatorProps): ReactElement {
    const controller = useController(createSeparator, { orientation })
    return usePart(controller.root, "div", rest)
  }
)
