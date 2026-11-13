<script lang="ts">
  import Part from "../Part.svelte"
  import { useToolbar } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useToolbar()
</script>

<Part part={controller.separator} tag="div" {...props} />
