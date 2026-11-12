<script lang="ts">
  import { createButton } from "@kirana-ui/core/button"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import type { PartAttributes } from "../types.ts"

  // A `<button>`, or with `child` and `nativeButton={false}` another element that acts as one.
  let { disabled, focusableWhenDisabled, nativeButton, ...rest }: PartAttributes = $props()
  const made = controller(createButton, () => ({ disabled, focusableWhenDisabled, nativeButton }))
</script>

<Part part={made.root} tag="button" {...rest} />
