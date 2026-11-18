<script lang="ts">
  import Part from "../Part.svelte"
  import { useTabs } from "./context.ts"
  import type { IndicatorProps } from "./types.ts"

  let props: IndicatorProps = $props()
  const part = useTabs().indicator
</script>

<Part of={part} tag="span" {...props} />
