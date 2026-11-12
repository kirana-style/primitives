<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { useTabs } from "./context.ts"

  let { activateOnFocus, loop, ...rest } = $props()
  const controller = useTabs()
  $effect.pre(() => {
    controller.listOptions.set(defined({ activateOnFocus, loop }))
  })
</script>

<Part part={controller.list} tag="div" {...rest} />
