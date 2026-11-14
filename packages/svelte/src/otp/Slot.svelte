<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { provideSlot, useOtp } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // One cell: it shows its character, then whatever it is given (a caret).
  let { index, children, ...rest }: { index: number } & PartAttributes = $props()
  // A cell is its place for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const slot = provideSlot(useOtp().slot(index))
  const char = fromSignal(slot.char)
</script>

<Part part={slot.part} tag="div" {...rest}>{char.current}{@render children?.()}</Part>
