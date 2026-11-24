import type { StateOf } from "@kirana-ui/core"
import { createButton } from "@kirana-ui/core/button"
import type { ButtonProps as CoreProps } from "@kirana-ui/core/button"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import type { ReactElement } from "react"

import { component, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type ButtonProps = PartComponentProps<
  "button",
  StateOf<Vocabulary["button"]["root"]>,
  CoreProps
>

/**
 * A `<button>`, or with `render` and `nativeButton={false}` another element that acts as one; a
 * link that navigates (`render={<a href="/x" />}`) stays a link.
 */
export const Button = /* @__PURE__ */ component(
  "Button",
  function Button({
    disabled,
    focusableWhenDisabled,
    nativeButton,
    ...rest
  }: ButtonProps): ReactElement {
    const controller = useController(createButton, {
      disabled,
      focusableWhenDisabled,
      nativeButton,
    })
    return usePart(controller.root, "button", rest)
  }
)
