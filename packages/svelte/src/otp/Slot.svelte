<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { provideSlot, useOtp } from "./context.ts"
  import type { SlotProps } from "./types.ts"

  // One cell: it shows its character, then whatever it is given (a caret).
  let { index, children, ...rest }: SlotProps = $props()
  // A cell is its place for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const slot = provideSlot(useOtp().slot(index))
  const char = fromSignal(slot.char)
</script>

<!-- The character is the cell's own, not its content: with `child` the snippet is given it. -->
<Part of={slot.part} tag="div" {...rest} held={{ char: char.current }}>{char.current}{@render children?.()}</Part>
