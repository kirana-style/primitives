<script lang="ts">
  import type { MenuCheckboxItemProps } from "@kirana-ui/core/menu"
  import type { ChangeDetails } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provideCheckbox, useMenu } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let {
    checked = $bindable(),
    defaultChecked,
    onCheckedChange,
    disabled,
    label,
    closeOnClick,
    ...rest
  }: MenuCheckboxItemProps & PartAttributes = $props()

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
      closeOnClick,
      onCheckedChange: change,
    }))
  )
</script>

<Part part={item.part} tag="div" {...rest} />
