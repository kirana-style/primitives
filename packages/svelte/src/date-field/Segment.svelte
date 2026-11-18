<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useDateField } from "./context.ts"
  import type { SegmentProps } from "./types.ts"

  // One piece: a part that is typed, or what stands between two. It writes its own text.
  let { segment, ...rest }: SegmentProps = $props()
  // svelte-ignore state_referenced_locally
  const made = useDateField().segment(segment)
  const shown = fromSignal(made.text)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{shown.current}{/snippet}

<Part of={made.part} tag="span" {...rest} held={{ text: written }}>{@render written()}</Part>
