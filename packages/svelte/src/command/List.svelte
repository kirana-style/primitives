<script lang="ts">
  import Part from "../Part.svelte"
  import { useCommand } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useCommand()
</script>

<Part part={controller.list} tag="div" {...props} />
