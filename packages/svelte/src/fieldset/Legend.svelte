<script lang="ts">
  import Part from "../Part.svelte"
  import { useFieldset } from "./context.ts"
  import type { LegendProps } from "./types.ts"

  let props: LegendProps = $props()
  const controller = useFieldset()
  if (!controller) throw new Error("A Fieldset part must be inside <Fieldset.Root>")
</script>

<Part of={controller.legend} tag="div" {...props} />
