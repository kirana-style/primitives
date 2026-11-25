<script lang="ts">
  import Part from "../Part.svelte"
  import { useIndex, useSteps } from "./context.ts"
  import type { IndicatorProps } from "./types.ts"

  let props: IndicatorProps = $props()
  const part = useSteps().indicator(useIndex("Indicator"))
</script>

<Part of={part} tag="span" {...props} />
