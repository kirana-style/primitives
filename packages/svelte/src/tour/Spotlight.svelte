<script lang="ts">
  import Part from "../Part.svelte"
  import { useTour } from "./context.ts"
  import type { SpotlightProps } from "./types.ts"

  let props: SpotlightProps = $props()
  const part = useTour().spotlight
</script>

<Part of={part} tag="div" {...props} />
