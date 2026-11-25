<script lang="ts">
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { ITEM, useFileUpload } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  let { entry, ...rest }: ItemProps = $props()
  const controller = useFileUpload()
  // The parts inside read the file as its prop is now.
  setContext(ITEM, () => entry)
</script>

<Part of={controller.item(entry.key)} tag="li" {...rest} />
