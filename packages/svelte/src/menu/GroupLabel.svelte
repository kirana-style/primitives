<script lang="ts">
  import Part from "../Part.svelte"
  import { useGroup, useMenu } from "./context.ts"
  import type { GroupLabelProps } from "./types.ts"

  // Names the group it is in. With no group around it, it is plain text.
  let props: GroupLabelProps = $props()
  const part = useGroup()?.label ?? useMenu().label
</script>

<Part of={part} tag="div" {...props} />
