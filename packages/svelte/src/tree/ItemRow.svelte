<script lang="ts">
  import Part from "../Part.svelte"
  import { useItem } from "./context.ts"
  import type { ItemRowProps } from "./types.ts"

  let props: ItemRowProps = $props()
  const part = useItem().row
</script>

<Part of={part} tag="div" {...props} />
