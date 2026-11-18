<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { useTooltip } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  // `delay` and `closeDelay` here come before the root's.
  let { delay, closeDelay, ...rest }: TriggerProps = $props()
  const controller = useTooltip()
  $effect.pre(() => {
    controller.timing.set(defined({ delay, closeDelay }))
  })
</script>

<Part of={controller.trigger} tag="button" {...rest} />
