<script lang="ts">
  import { createAvatar } from "@kirana-ui/core/avatar"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const made = provide(controller(createAvatar, () => ({})))
</script>

<Part part={made.root} tag="span" {...props} />
