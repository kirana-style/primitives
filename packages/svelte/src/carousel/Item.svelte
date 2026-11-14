<script lang="ts">
  import Part from "../Part.svelte"
  import { useCarousel } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { index, ...props }: { index: number } & PartAttributes = $props()
  // A slide is its place for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useCarousel().item(index)
</script>

<Part {part} tag="div" {...props} />
