<script lang="ts">
  import Part from "../Part.svelte"
  import { usePagination } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = usePagination()
</script>

<Part part={controller.next} tag="button" {...props} />
