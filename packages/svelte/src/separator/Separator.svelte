<script lang="ts">
  import type { SeparatorProps } from "@kirana-ui/core/separator"
  import { createSeparator } from "@kirana-ui/core/separator"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import type { RootProps } from "../types.ts"

  let { orientation, ...rest }: RootProps<SeparatorProps> = $props()
  const made = controller(createSeparator, () => ({ orientation }))
</script>

<Part part={made.root} tag="div" {...rest} />
