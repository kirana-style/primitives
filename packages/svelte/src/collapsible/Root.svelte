<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createCollapsible } from "@kirana-ui/core/collapsible"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { open = $bindable(), defaultOpen, onOpenChange, disabled, id, ...rest }: PartAttributes = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  const made = provide(
    controller(createCollapsible, () => ({
      id: id ?? generated,
      open,
      defaultOpen,
      disabled,
      onOpenChange: change,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
