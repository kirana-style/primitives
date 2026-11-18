<script lang="ts">
  import Part from "../Part.svelte"
  import { useCarousel } from "./context.ts"
  import type { ViewportProps } from "./types.ts"

  let props: ViewportProps = $props()
  const controller = useCarousel()
</script>

<Part of={controller.viewport} tag="div" {...props} />
