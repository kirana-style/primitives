<script lang="ts">
  import Part from "../Part.svelte"
  import { useScrollbar } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const bar = useScrollbar()
</script>

<Part part={bar.thumb} tag="div" {...props} />
