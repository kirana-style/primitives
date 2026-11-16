<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { useHoverCard } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // `delay` and `closeDelay` here come before the root's.
  let { delay, closeDelay, ...rest }: { delay?: number; closeDelay?: number } & PartAttributes = $props()
  const controller = useHoverCard()
  $effect.pre(() => {
    controller.timing.set(defined({ delay, closeDelay }))
  })
</script>

<Part part={controller.trigger} tag="a" {...rest} />
