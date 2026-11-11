<script lang="ts">
  import Part from "../Part.svelte"
  import { useItem } from "./context.ts"

  let props = $props()
  const part = useItem().trigger
</script>

<Part {part} tag="button" {...props} />
