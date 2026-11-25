<script lang="ts">
  import Part from "../Part.svelte"
  import { useEntry, useTagsInput } from "./context.ts"
  import type { ItemRemoveProps } from "./types.ts"

  let props: ItemRemoveProps = $props()
  const part = useTagsInput().itemRemove(useEntry("ItemRemove")().key)
</script>

<Part of={part} tag="button" {...props} />
