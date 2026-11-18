<script lang="ts">
  import Part from "../Part.svelte"
  import { useSelect } from "./context.ts"
  import type { SeparatorProps } from "./types.ts"

  // A line between groups.
  let props: SeparatorProps = $props()
  const controller = useSelect()
</script>

<Part of={controller.separator} tag="div" {...props} />
