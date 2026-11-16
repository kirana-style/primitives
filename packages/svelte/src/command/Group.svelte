<script lang="ts">
  import Part from "../Part.svelte"
  import { provideGroup, useCommand } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // Items under a `<Command.GroupHeading>`. Hidden while none of them is shown.
  let { id, ...rest }: { id?: string } & PartAttributes = $props()
  const generated = $props.id()
  // A group is its id for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const group = provideGroup(useCommand().group(id ?? generated))
</script>

<Part part={group.part} tag="div" {...rest} />
