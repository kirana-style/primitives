<script lang="ts">
  import Part from "../Part.svelte"
  import { useSlider } from "./context.ts"
  import type { IndicatorProps } from "./types.ts"

  let props: IndicatorProps = $props()
  const controller = useSlider()
</script>

<Part of={controller.indicator} tag="div" {...props} />
