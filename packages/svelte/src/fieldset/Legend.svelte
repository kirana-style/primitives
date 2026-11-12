<script lang="ts">
  import Part from "../Part.svelte"
  import { useFieldset } from "./context.ts"

  let props = $props()
  const controller = useFieldset()
  if (!controller) throw new Error("A Fieldset part must be inside <Fieldset.Root>")
</script>

<Part part={controller.legend} tag="div" {...props} />
