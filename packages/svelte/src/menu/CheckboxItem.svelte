<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provideCheckbox, useMenu } from "./context.ts"
  import type { CheckboxItemProps } from "./types.ts"

  let {
    checked = $bindable(),
    defaultChecked,
    onCheckedChange,
    disabled,
    label,
    closeOnSelect,
    closeOnClick,
    ...rest
  }: CheckboxItemProps = $props()

  function change(next: boolean, by: ChangeDetails) {
    onCheckedChange?.(next, by)
    if (!by.canceled) checked = next
  }

  const item = provideCheckbox(
    controller(useMenu().checkboxItem, () => ({
      checked,
      defaultChecked,
      disabled,
      label,
      closeOnSelect,
      closeOnClick,
      onCheckedChange: change,
    }))
  )
</script>

<Part of={item.part} tag="div" {...rest} />
