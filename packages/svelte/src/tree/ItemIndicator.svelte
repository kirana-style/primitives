<script lang="ts">
  import Part from "../Part.svelte"
  import { useItem } from "./context.ts"
  import type { ItemIndicatorProps } from "./types.ts"

  let props: ItemIndicatorProps = $props()
  const part = useItem().indicator
</script>

<Part of={part} tag="span" {...props} />
