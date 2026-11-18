<script lang="ts">
  import { getContext } from "svelte"

  import Part from "../Part.svelte"
  import { ITEM, useSelect } from "./context.ts"
  import type { ItemTextProps } from "./types.ts"

  let props: ItemTextProps = $props()
  const part = useSelect().itemText(getContext(ITEM))
</script>

<Part of={part} tag="span" {...props} />
