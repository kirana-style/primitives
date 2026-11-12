<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createTabs } from "@kirana-ui/core/tabs"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { value = $bindable(), defaultValue, onValueChange, orientation, id, ...rest }: PartAttributes = $props()
  const generated = $props.id()

  function change(next: unknown, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(within(createTabs, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      orientation,
      onValueChange: change,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
