<script lang="ts">
  import Part from "../Part.svelte"
  import { useScroller } from "./context.ts"
  import type { ViewportProps } from "./types.ts"

  let props: ViewportProps = $props()
  const controller = useScroller()
</script>

<Part of={controller.viewport} tag="div" {...props} />
