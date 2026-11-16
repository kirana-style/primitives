<script lang="ts">
  import type { PositionOptions } from "@kirana-ui/core"
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { useSelect } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // `alignItemWithTrigger`: the list opens over its trigger, the chosen item's text on the
  // trigger's own, where there is room and unless a finger opened it.
  let { side, align, sideOffset, alignOffset, collisionPadding, alignItemWithTrigger, ...rest }: Partial<PositionOptions> & { alignItemWithTrigger?: boolean } & PartAttributes = $props()
  const controller = useSelect()
  // Before the element attaches: the first placement reads these.
  $effect.pre(() => {
    controller.positioning.set(defined({ side, align, sideOffset, alignOffset, collisionPadding }))
    controller.alignItemWithTrigger.set(Boolean(alignItemWithTrigger))
  })
</script>

<Part part={controller.positioner} tag="div" {...rest} />
