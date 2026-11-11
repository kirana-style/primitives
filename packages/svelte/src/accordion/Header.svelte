<script lang="ts">
  import Part from "../Part.svelte"
  import { useItem } from "./context.ts"

  let props = $props()
  const part = useItem().header
</script>

<Part {part} tag="h3" {...props} />
