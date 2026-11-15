<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCalendar } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // Names the month shown, unless it is given something else to say.
  let { children, ...rest }: PartAttributes = $props()
  const controller = useCalendar()
  const title = fromSignal(controller.title)
</script>

<Part part={controller.heading} tag="div" {...rest}
  >{#if children}{@render children()}{:else}{title.current}{/if}</Part
>
