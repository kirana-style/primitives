<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createToggle } from "@kirana-ui/core/toggle"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"

  let { pressed = $bindable(), defaultPressed, onPressedChange, disabled, ...rest } = $props()

  function change(next: boolean, by: ChangeDetails) {
    onPressedChange?.(next, by)
    if (!by.canceled) pressed = next
  }

  const made = controller(createToggle, () => ({
    pressed,
    defaultPressed,
    disabled,
    onPressedChange: change,
  }))
</script>

<Part part={made.root} tag="button" {...rest} />
