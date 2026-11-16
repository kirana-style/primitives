<script lang="ts">
  import Part from "../Part.svelte"
  import { provideGroup, useSelect } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // Items that belong together, named by their `<Select.GroupLabel>`.
  let { id, ...props }: { id?: string } & PartAttributes = $props()
  const generated = $props.id()
  // A group is its id for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const group = provideGroup(useSelect().group(id ?? generated))
</script>

<Part part={group.root} tag="div" {...props} />
