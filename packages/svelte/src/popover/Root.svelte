<script lang="ts">
  import type { PopoverProps } from "@kirana-ui/core/popover"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createPopover } from "@kirana-ui/core/popover"

  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let { open = $bindable(), defaultOpen, onOpenChange, id, children }: RootProps<PopoverProps> = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(controller(createPopover, () => ({ id: id ?? generated, open, defaultOpen, onOpenChange: change })))
</script>

{@render children?.()}
