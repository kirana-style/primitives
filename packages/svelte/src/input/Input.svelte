<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createInput } from "@kirana-ui/core/input"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import type { PartAttributes } from "../types.ts"

  // An `<input>`; `as="textarea"` for a text area. It takes what an `<input>` takes, and
  // `bind:value`. Inside a `<Field.Root>` it is the field's control.
  let {
    as = "input",
    value = $bindable(),
    disabled,
    onValueChange,
    ...rest
  }: {
    as?: "input" | "textarea"
    value?: string
    disabled?: boolean
    onValueChange?: (value: string, details: ChangeDetails) => void
  } & PartAttributes = $props()
  const made = controller(within(createInput, { field: useFieldAround() }), () => ({
    disabled,
    onValueChange(next: string, by: ChangeDetails) {
      onValueChange?.(next, by)
      value = next
    },
  }))
</script>

<Part part={made.input} tag={as} {...rest} {...value === undefined ? {} : { value }} />
