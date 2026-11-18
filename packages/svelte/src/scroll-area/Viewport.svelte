<script lang="ts">
  import Part from "../Part.svelte"
  import { useScrollArea } from "./context.ts"
  import type { ViewportProps } from "./types.ts"

  let props: ViewportProps = $props()
  const controller = useScrollArea()
</script>

<Part of={controller.viewport} tag="div" {...props} />
