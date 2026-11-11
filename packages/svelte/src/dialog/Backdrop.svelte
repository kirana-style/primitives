<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"

  let props = $props()
  const controller = useDialog()
</script>

<Part part={controller.backdrop} tag="div" {...props} />
