<script lang="ts">
  import Part from "../Part.svelte"
  import { useItem } from "./context.ts"
  import type { ItemTextProps } from "./types.ts"

  let props: ItemTextProps = $props()
  const part = useItem().text
</script>

<Part of={part} tag="span" {...props} />
