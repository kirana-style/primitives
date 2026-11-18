<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { SeparatorProps } from "./types.ts"

  // A line between groups.
  let props: SeparatorProps = $props()
  const controller = useCombobox()
</script>

<Part of={controller.separator} tag="div" {...props} />
