<script lang="ts">
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { ITEM, useTagsInput } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  let { entry, ...rest }: ItemProps = $props()
  const controller = useTagsInput()
  // The parts inside read the tag as it is now: an edit keeps its key and changes its text.
  setContext(ITEM, () => entry)
</script>

<Part of={controller.item(entry.key)} tag="span" {...rest} />
