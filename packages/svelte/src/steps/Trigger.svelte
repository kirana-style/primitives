<script lang="ts">
  import Part from "../Part.svelte"
  import { useIndex, useSteps } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let props: TriggerProps = $props()
  const part = useSteps().trigger(useIndex("Trigger"))
</script>

<Part of={part} tag="button" {...props} />
