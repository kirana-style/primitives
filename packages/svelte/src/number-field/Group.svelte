<script lang="ts">
  import Part from "../Part.svelte"
  import { useNumberField } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useNumberField()
</script>

<Part part={controller.group} tag="div" {...props} />
