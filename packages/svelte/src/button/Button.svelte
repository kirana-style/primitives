<script lang="ts">
  import type { ButtonProps } from "@kirana-ui/core/button"
  import { createButton } from "@kirana-ui/core/button"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import type { RootProps } from "../types.ts"

  // A `<button>`, or with `child` and `nativeButton={false}` another element that acts as one.
  let { disabled, focusableWhenDisabled, nativeButton, ...rest }: RootProps<ButtonProps> = $props()
  const made = controller(createButton, () => ({ disabled, focusableWhenDisabled, nativeButton }))
</script>

<Part part={made.root} tag="button" {...rest} />
