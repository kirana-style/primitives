<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { within } from "@kirana-ui/core"
  import { createDialog } from "@kirana-ui/core/dialog"

  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let { open = $bindable(), defaultOpen, modal, disablePointerDismissal, closeOnOutsidePress, dismissible, onOpenChange, id, children }: RootProps = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(controller(within(createDialog, { direction: useDirectionAround() }), () => ({ id: id ?? generated, open, defaultOpen, modal, disablePointerDismissal, closeOnOutsidePress, dismissible, onOpenChange: change })))
</script>

{@render children?.()}
