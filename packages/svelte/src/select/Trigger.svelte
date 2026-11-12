<script lang="ts">
  import Part from "../Part.svelte"
  import { useSelect } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useSelect()
</script>

<Part part={controller.trigger} tag="button" {...props} />
