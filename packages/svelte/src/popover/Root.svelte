<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createPopover } from "@kirana-ui/core/popover"

  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  let { open = $bindable(), defaultOpen, onOpenChange, id, children } = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(controller(createPopover, () => ({ id: id ?? generated, open, defaultOpen, onOpenChange: change })))
</script>

{@render children?.()}
