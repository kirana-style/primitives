<script lang="ts">
  import Part from "../Part.svelte"
  import { useSelect } from "./context.ts"
  import type { ListProps } from "./types.ts"

  // The items' own box inside the popup, when the popup also holds scroll arrows.
  let props: ListProps = $props()
  const controller = useSelect()
</script>

<Part of={controller.list} tag="div" {...props} />
