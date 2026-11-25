<script lang="ts">
  import Part from "../Part.svelte"
  import { useTour } from "./context.ts"
  import type { ArrowProps } from "./types.ts"

  let props: ArrowProps = $props()
  const part = useTour().arrow
</script>

<Part of={part} tag="div" {...props} />
