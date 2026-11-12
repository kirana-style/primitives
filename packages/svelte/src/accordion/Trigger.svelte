<script lang="ts">
  import Part from "../Part.svelte"
  import { useItem } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const part = useItem().trigger
</script>

<Part {part} tag="button" {...props} />
