<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let { openOnHover, delay, closeDelay, ...rest }: TriggerProps = $props()
  const controller = usePopover()
  $effect.pre(() => {
    controller.hovering.set(defined({ openOnHover, delay, closeDelay }))
  })
</script>

<Part of={controller.trigger} tag="button" {...rest} />
