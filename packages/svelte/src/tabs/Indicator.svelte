<script lang="ts">
  import Part from "../Part.svelte"
  import { useTabs } from "./context.ts"

  let props = $props()
  const part = useTabs().indicator
</script>

<Part {part} tag="span" {...props} />
