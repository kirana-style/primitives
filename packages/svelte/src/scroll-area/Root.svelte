<script lang="ts">
  import { within } from "@kirana-ui/core"
  import { createScrollArea } from "@kirana-ui/core/scroll-area"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const made = provide(
    controller(within(createScrollArea, { direction: useDirectionAround() }), () => ({}))
  )
</script>

<Part part={made.root} tag="div" {...props} />
