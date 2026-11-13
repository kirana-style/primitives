<script lang="ts">
  import { getContext } from "svelte"

  import Part from "../Part.svelte"
  import { CHIP, useCombobox } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const part = useCombobox().chipRemove(getContext(CHIP))
</script>

<Part {part} tag="button" {...props} />
