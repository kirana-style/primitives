<script lang="ts">
  import Part from "../Part.svelte"
  import { useEntry, useTagsInput } from "./context.ts"
  import type { ItemInputProps } from "./types.ts"

  let props: ItemInputProps = $props()
  const part = useTagsInput().itemInput(useEntry("ItemInput")().key)
</script>

<Part of={part} tag="input" {...props} />
