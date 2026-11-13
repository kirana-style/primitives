<script lang="ts">
  import Part from "../Part.svelte"
  import { useGroup, useMenu } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // Names the group it is in. With no group around it, it is plain text.
  let props: PartAttributes = $props()
  const part = useGroup()?.label ?? useMenu().label
</script>

<Part {part} tag="div" {...props} />
