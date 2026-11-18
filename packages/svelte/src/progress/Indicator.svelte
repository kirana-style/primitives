<script lang="ts">
  import Part from "../Part.svelte"
  import { useProgress } from "./context.ts"
  import type { IndicatorProps } from "./types.ts"

  let props: IndicatorProps = $props()
  const controller = useProgress()
</script>

<Part of={controller.indicator} tag="div" {...props} />
