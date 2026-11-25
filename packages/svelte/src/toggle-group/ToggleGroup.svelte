<script lang="ts" generics="Value">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createToggleGroup } from "@kirana-ui/core/toggle-group"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provideToggleGroup, useToolbarAround } from "../toolbar/context.ts"
  import type { ToggleGroupProps } from "./types.ts"

  // Toggles that are one control. Each `<Toggle value>` inside it is one of its toggles.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    multiple,
    disabled,
    orientation,
    loop,
    loopFocus,
    ...rest
  }: ToggleGroupProps<Value> = $props()

  function change(next: Value[], by: ChangeDetails) {
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
      loopFocus,
      onValueChange: change,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
