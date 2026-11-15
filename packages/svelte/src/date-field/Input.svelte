<script lang="ts">
  import Part from "../Part.svelte"
  import { useDateField } from "./context.ts"
  import type { Attributes } from "../types.ts"

  let props: Attributes = $props()
  const controller = useDateField()
</script>

<Part part={controller.input} tag="input" {...props} />
