<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { useTabs } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { activateOnFocus, loop, ...rest }: PartAttributes = $props()
  const controller = useTabs()
  $effect.pre(() => {
    controller.listOptions.set(defined({ activateOnFocus, loop }))
  })
</script>

<Part part={controller.list} tag="div" {...rest} />
