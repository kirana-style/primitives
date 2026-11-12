<script lang="ts">
  import Part from "../Part.svelte"
  import { useField } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useField()
</script>

<Part part={controller.label} tag="label" {...props} />
