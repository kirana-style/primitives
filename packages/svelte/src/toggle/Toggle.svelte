<script lang="ts">
  import type { ToggleProps } from "@kirana-ui/core/toggle"
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createToggle } from "@kirana-ui/core/toggle"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { useToggleGroupAround, useToolbarAround } from "../toolbar/context.ts"
  import type { RootProps } from "../types.ts"

  // Inside a `<ToggleGroup>`, `value` makes it one of the group's toggles.
  let { pressed = $bindable(), defaultPressed, onPressedChange, disabled, value, ...rest }: RootProps<ToggleProps> = $props()

  function change(next: boolean, by: ChangeDetails) {
    onPressedChange?.(next, by)
    if (!by.canceled) pressed = next
  }

  const around = { group: useToggleGroupAround(), toolbar: useToolbarAround() }
  const made = controller(within(createToggle, around), () => ({
    pressed,
    defaultPressed,
    disabled,
    value,
    onPressedChange: change,
  }))
</script>

<Part part={made.root} tag="button" {...rest} />
