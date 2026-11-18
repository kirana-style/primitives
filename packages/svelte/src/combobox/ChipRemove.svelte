<script lang="ts">
  import { getContext } from "svelte"

  import Part from "../Part.svelte"
  import { CHIP, useCombobox } from "./context.ts"
  import type { ChipRemoveProps } from "./types.ts"

  let props: ChipRemoveProps = $props()
  const part = useCombobox().chipRemove(getContext(CHIP))
</script>

<Part of={part} tag="button" {...props} />
