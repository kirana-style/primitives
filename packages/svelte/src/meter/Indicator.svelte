<script lang="ts">
  import Part from "../Part.svelte"
  import { useMeter } from "./context.ts"
  import type { IndicatorProps } from "./types.ts"

  let props: IndicatorProps = $props()
  const controller = useMeter()
</script>

<Part of={controller.indicator} tag="div" {...props} />
