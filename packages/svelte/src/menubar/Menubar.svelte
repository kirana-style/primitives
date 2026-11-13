<script lang="ts">
  import type { MenubarProps } from "@kirana-ui/core/menubar"
  import { within } from "@kirana-ui/core"
  import { createMenubar } from "@kirana-ui/core/menubar"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { provideMenubar } from "../menu/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import type { RootProps } from "../types.ts"

  // A row of menus that work as one. Each `<Menu.Root>` inside it is one of its items.
  let { loop, disabled, orientation, id, ...rest }: RootProps<MenubarProps> = $props()
  const generated = $props.id()
  const made = provideMenubar(
    controller(within(createMenubar, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      loop,
      disabled,
      orientation,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
