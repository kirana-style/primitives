<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createDialog } from "@kirana-ui/core/dialog"

  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  let { open = $bindable(), defaultOpen, modal, dismissible, onOpenChange, id, children } = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(controller(createDialog, () => ({ id: id ?? generated, open, defaultOpen, modal, dismissible, onOpenChange: change })))
</script>

{@render children?.()}
