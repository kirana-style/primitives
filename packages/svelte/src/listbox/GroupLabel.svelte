<script lang="ts">
  import Part from "../Part.svelte"
  import { useGroup } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const group = useGroup()
</script>

<Part part={group.label} tag="div" {...props} />
