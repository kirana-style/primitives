<script lang="ts">
  import Part from "../Part.svelte"
  import { useCollapsible } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useCollapsible()
</script>

<Part part={controller.trigger} tag="button" {...props} />
