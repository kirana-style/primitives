<script lang="ts">
  import Part from "../Part.svelte"
  import { provideParts, useToast } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let { toast, ...rest }: RootProps = $props()
  // A root is its toast for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const parts = provideParts(useToast().toast(toast.id))
</script>

<Part of={parts.root} tag="div" {...rest} />
