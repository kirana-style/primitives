<script lang="ts">
  import Part from "../Part.svelte"
  import { provideGroup, useListbox } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { id, ...props }: { id?: string } & PartAttributes = $props()
  const generated = $props.id()
  // A group is its id for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const group = provideGroup(useListbox().group(id ?? generated))
</script>

<Part part={group.root} tag="div" {...props} />
