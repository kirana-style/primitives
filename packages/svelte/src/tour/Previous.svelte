<script lang="ts">
  import Part from "../Part.svelte"
  import { useTour } from "./context.ts"
  import type { PreviousProps } from "./types.ts"

  let props: PreviousProps = $props()
  const part = useTour().previous
</script>

<Part of={part} tag="button" {...props} />
