<script lang="ts">
  import Part from "../Part.svelte"
  import { useToolbar } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const part = useToolbar().link()
</script>

<Part {part} tag="a" {...props} />
