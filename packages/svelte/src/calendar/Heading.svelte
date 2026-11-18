<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useCalendar } from "./context.ts"
  import type { HeadingProps } from "./types.ts"

  // Names the month shown, unless it is given something else to say.
  let { children, ...rest }: HeadingProps = $props()
  const controller = useCalendar()
  const title = fromSignal(controller.title)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{#if children}{@render children()}{:else}{title.current}{/if}{/snippet}

<Part of={controller.heading} tag="div" {...rest} held={{ text: written }}>{@render written()}</Part>
