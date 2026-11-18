import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createCheckboxGroup } from "@kirana-ui/core/checkbox-group"
import type {
  CheckboxGroup as Controller,
  CheckboxGroupProps as CoreProps,
} from "@kirana-ui/core/checkbox-group"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext } from "react"
import type { ReactElement } from "react"

import { CheckboxGroupContext } from "./checkbox-group-context.ts"
import { FieldContext } from "./field-context.ts"
import { component, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type CheckboxGroupProps = PartComponentProps<
  "div",
  StateOf<Vocabulary["checkboxGroup"]["root"]>,
  Omit<CoreProps, "id"> & { id?: string }
>

/**
 * Checkboxes that hold one list of values. Each `<Checkbox.Root value>` inside it is checked
 * while the list has its value; with `allValues`, a `<Checkbox.Root parent>` stands for them all.
 */
export const CheckboxGroup = /* @__PURE__ */ component(
  "CheckboxGroup",
  function CheckboxGroup({
    value,
    defaultValue,
    onValueChange,
    allValues,
    disabled,
    id,
    ...rest
  }: CheckboxGroupProps): ReactElement {
    const field = useContext(FieldContext) ?? undefined
    const controller = useController<CoreProps, Controller>(
      within(createCheckboxGroup, { field }),
      {
        value,
        defaultValue,
        onValueChange,
        allValues,
        disabled,
        id,
      }
    )
    return (
      <CheckboxGroupContext.Provider value={controller}>
        {usePart(controller.root, "div", rest)}
      </CheckboxGroupContext.Provider>
    )
  }
)
