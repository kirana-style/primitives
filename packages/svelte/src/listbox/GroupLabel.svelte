<script lang="ts">
  import Part from "../Part.svelte"
  import { useGroup } from "./context.ts"
  import type { GroupLabelProps } from "./types.ts"

  let props: GroupLabelProps = $props()
  const group = useGroup()
</script>

<Part of={group.label} tag="div" {...props} />
