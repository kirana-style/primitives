<script lang="ts">
  import Part from "../Part.svelte"
  import { useToolbar } from "./context.ts"
  import type { SeparatorProps } from "./types.ts"

  let props: SeparatorProps = $props()
  const controller = useToolbar()
</script>

<Part of={controller.separator} tag="div" {...props} />
