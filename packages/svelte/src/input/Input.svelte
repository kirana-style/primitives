<script lang="ts" generics="As extends 'input' | 'textarea' = 'input'">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createInput } from "@kirana-ui/core/input"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import type { InputProps } from "./types.ts"

  // An `<input>`; `as="textarea"` for a text area. It takes what an `<input>` takes, and
  // `bind:value`. Inside a `<Field.Root>` it is the field's control.
  let {
    as,
    value = $bindable(),
    disabled,
    onValueChange,
    ...rest
  }: InputProps<As> = $props()
  const made = controller(within(createInput, { field: useFieldAround() }), () => ({
    disabled,
    onValueChange(next: string, by: ChangeDetails) {
      onValueChange?.(next, by)
      value = next
    },
  }))
</script>

<Part of={made.input} tag={as ?? "input"} {...rest} {...value === undefined ? {} : { value }} />
