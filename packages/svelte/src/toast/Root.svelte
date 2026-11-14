<script lang="ts">
  import type { ToastRecord } from "@kirana-ui/core/toast"

  import Part from "../Part.svelte"
  import { provideParts, useToast } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { toast, ...rest }: { toast: ToastRecord } & PartAttributes = $props()
  // A root is its toast for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const parts = provideParts(useToast().toast(toast.id))
</script>

<Part part={parts.root} tag="div" {...rest} />
