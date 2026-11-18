<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { ChipsProps } from "./types.ts"

  // With `multiple`: what holds the chips and the input.
  let props: ChipsProps = $props()
  const controller = useCombobox()
</script>

<Part of={controller.chips} tag="div" {...props} />
