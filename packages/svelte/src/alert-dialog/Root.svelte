<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createAlertDialog } from "@kirana-ui/core/alert-dialog"

  import { provide } from "../dialog/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import type { PartAttributes } from "../types.ts"

  // A dialog that asks for an answer: a press outside it does not close it.
  let { open = $bindable(), defaultOpen, onOpenChange, id, children }: PartAttributes = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(
    controller(createAlertDialog, () => ({
      id: id ?? generated,
      open,
      defaultOpen,
      onOpenChange: change,
    }))
  )
</script>

{@render children?.()}
