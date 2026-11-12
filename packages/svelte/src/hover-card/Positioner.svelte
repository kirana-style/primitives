<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { useHoverCard } from "./context.ts"

  let { side, align, sideOffset, alignOffset, collisionPadding, ...rest } = $props()
  const controller = useHoverCard()
  // Before the element attaches: the first placement reads these.
  $effect.pre(() => {
    controller.positioning.set(defined({ side, align, sideOffset, alignOffset, collisionPadding }))
  })
</script>

<Part part={controller.positioner} tag="div" {...rest} />
