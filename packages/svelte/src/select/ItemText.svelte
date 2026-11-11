<script lang="ts">
  import { getContext } from "svelte"

  import Part from "../Part.svelte"
  import { ITEM, useSelect } from "./context.ts"

  let props = $props()
  const part = useSelect().itemText(getContext(ITEM))
</script>

<Part {part} tag="span" {...props} />
