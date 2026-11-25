<script lang="ts">
  import Part from "../Part.svelte"
  import { useIndex, useSteps } from "./context.ts"
  import type { SeparatorProps } from "./types.ts"

  let props: SeparatorProps = $props()
  const part = useSteps().separator(useIndex("Separator"))
</script>

<Part of={part} tag="div" {...props} />
