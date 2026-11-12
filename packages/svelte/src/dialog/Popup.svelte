<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useDialog()
</script>

<Part part={controller.popup} tag="div" {...props} />
