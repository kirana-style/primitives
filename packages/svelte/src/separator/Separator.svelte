<script lang="ts">
  import { createSeparator } from "@kirana-ui/core/separator"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import type { SeparatorProps } from "./types.ts"

  let { orientation, ...rest }: SeparatorProps = $props()
  const made = controller(createSeparator, () => ({ orientation }))
</script>

<Part of={made.root} tag="div" {...rest} />
