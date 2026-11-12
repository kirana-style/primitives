<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createTabs } from "@kirana-ui/core/tabs"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  let { value = $bindable(), defaultValue, onValueChange, orientation, id, ...rest } = $props()
  const generated = $props.id()

  function change(next: unknown, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(createTabs, () => ({
      id: id ?? generated,
      value,
      defaultValue,
      orientation,
      onValueChange: change,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
