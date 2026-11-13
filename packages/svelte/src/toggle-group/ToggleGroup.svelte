<script lang="ts">
  import type { ToggleGroupProps } from "@kirana-ui/core/toggle-group"
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createToggleGroup } from "@kirana-ui/core/toggle-group"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provideToggleGroup, useToolbarAround } from "../toolbar/context.ts"
  import type { RootProps } from "../types.ts"

  // Toggles that are one control. Each `<Toggle value>` inside it is one of its toggles.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    multiple,
    disabled,
    orientation,
    loop,
    ...rest
  }: RootProps<ToggleGroupProps> = $props()

  function change(next: unknown[], by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const around = { direction: useDirectionAround(), toolbar: useToolbarAround() }
  const made = provideToggleGroup(
    controller(within(createToggleGroup, around), () => ({
      value,
      defaultValue,
      multiple,
      disabled,
      orientation,
      loop,
      onValueChange: change,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
