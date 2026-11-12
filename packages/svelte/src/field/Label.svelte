<script lang="ts">
  import Part from "../Part.svelte"
  import { useField } from "./context.ts"

  let props = $props()
  const controller = useField()
</script>

<Part part={controller.label} tag="label" {...props} />
