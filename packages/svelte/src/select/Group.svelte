<script lang="ts">
  import Part from "../Part.svelte"
  import { provideGroup, useSelect } from "./context.ts"
  import type { GroupProps } from "./types.ts"

  // Items that belong together, named by their `<Select.GroupLabel>`.
  let { id, ...props }: GroupProps = $props()
  const generated = $props.id()
  // A group is its id for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const group = provideGroup(useSelect().group(id ?? generated))
</script>

<Part of={group.root} tag="div" {...props} />
