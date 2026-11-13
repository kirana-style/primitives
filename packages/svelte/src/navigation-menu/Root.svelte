<script lang="ts">
  import type { NavigationMenuProps } from "@kirana-ui/core/navigation-menu"
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    delay,
    closeDelay,
    orientation,
    id,
    ...rest
  }: RootProps<NavigationMenuProps> = $props()
  const generated = $props.id()

  function change(next: unknown, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(within(createNavigationMenu, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      delay,
      closeDelay,
      orientation,
      onValueChange: change,
    }))
  )
</script>

<Part part={made.root} tag="nav" {...rest} />
