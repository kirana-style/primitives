<script lang="ts">
  import Part from "../Part.svelte"
  import { useTabs } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const part = useTabs().indicator
</script>

<Part {part} tag="span" {...props} />
