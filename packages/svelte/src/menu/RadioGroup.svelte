<script lang="ts">
  import type { MenuRadioGroupProps } from "@kirana-ui/core/menu"
  import type { ChangeDetails } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provideRadioGroup, useMenu } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    disabled,
    ...rest
  }: MenuRadioGroupProps & PartAttributes = $props()

  function change(next: unknown, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const group = provideRadioGroup(
    controller(useMenu().radioGroup<unknown>, () => ({
      value,
      defaultValue,
      disabled,
      onValueChange: change,
    }))
  )
</script>

<Part part={group.root} tag="div" {...rest} />
