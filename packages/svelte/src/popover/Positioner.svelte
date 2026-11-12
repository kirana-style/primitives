<script lang="ts">
  import type { PositionOptions } from "@kirana-ui/core"
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { side, align, sideOffset, alignOffset, collisionPadding, ...rest }: Partial<PositionOptions> & PartAttributes = $props()
  const controller = usePopover()
  // Before the element attaches: the first placement reads these.
  $effect.pre(() => {
    controller.positioning.set(defined({ side, align, sideOffset, alignOffset, collisionPadding }))
  })
</script>

<Part part={controller.positioner} tag="div" {...rest} />
