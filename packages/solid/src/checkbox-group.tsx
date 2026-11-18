import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createCheckboxGroup } from "@kirana-ui/core/checkbox-group"
import type { CheckboxGroupProps as CoreProps } from "@kirana-ui/core/checkbox-group"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { CheckboxGroupContext } from "./checkbox-group-context.ts"
import { FieldContext } from "./field-context.ts"
import { Part, controller } from "./runtime.tsx"
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
export function CheckboxGroup(props: CheckboxGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "allValues",
    "disabled",
    "id",
  ])
  const generated = createUniqueId()
  const field = useContext(FieldContext)
  const made = controller(within(createCheckboxGroup, { field }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    allValues: local.allValues,
    disabled: local.disabled,
    onValueChange: (value: string[], details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <CheckboxGroupContext.Provider value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </CheckboxGroupContext.Provider>
  )
}
