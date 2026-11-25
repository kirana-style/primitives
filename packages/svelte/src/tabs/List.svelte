<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { useTabs } from "./context.ts"
  import type { ListProps } from "./types.ts"

  let { activateOnFocus, loop, loopFocus, ...rest }: ListProps = $props()
  const controller = useTabs()
  $effect.pre(() => {
    controller.listOptions.set(defined({ activateOnFocus, loop, loopFocus }))
  })
</script>

<Part of={controller.list} tag="div" {...rest} />
