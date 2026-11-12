<script lang="ts">
  import { createSeparator } from "@kirana-ui/core/separator"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import type { PartAttributes } from "../types.ts"

  let { orientation, ...rest }: PartAttributes = $props()
  const made = controller(createSeparator, () => ({ orientation }))
</script>

<Part part={made.root} tag="div" {...rest} />
