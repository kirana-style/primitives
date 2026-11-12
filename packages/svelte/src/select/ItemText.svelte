<script lang="ts">
  import { getContext } from "svelte"

  import Part from "../Part.svelte"
  import { ITEM, useSelect } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const part = useSelect().itemText(getContext(ITEM))
</script>

<Part {part} tag="span" {...props} />
