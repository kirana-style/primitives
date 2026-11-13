<script lang="ts">
  import type { MenuProps } from "@kirana-ui/core/menu"
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createMenu } from "@kirana-ui/core/menu"

  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide, useMenu } from "./context.ts"
  import type { RootProps } from "../types.ts"

  // A menu that one of this menu's items opens. Its trigger is `<Menu.SubmenuTrigger>`.
  let { open = $bindable(), defaultOpen, onOpenChange, disabled, loop, modal, id, children }: RootProps<MenuProps> = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(
    controller(within(createMenu, { parent: useMenu(), direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      open,
      defaultOpen,
      disabled,
      loop,
      modal,
      onOpenChange: change,
    }))
  )
</script>

{@render children?.()}
