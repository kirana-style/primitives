<script lang="ts" generics="Value">
  import type { ChangeDetails } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provideRadioGroup, useMenu } from "./context.ts"
  import type { RadioGroupProps } from "./types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    disabled,
    ...rest
  }: RadioGroupProps<Value> = $props()

  function change(next: Value, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const group = provideRadioGroup(
    controller(useMenu().radioGroup<Value>, () => ({
      value,
      defaultValue,
      disabled,
      onValueChange: change,
    }))
  )
</script>

<Part of={group.root} tag="div" {...rest} />
