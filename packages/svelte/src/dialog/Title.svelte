<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"

  let props = $props()
  const controller = useDialog()
</script>

<Part part={controller.title} tag="h2" {...props} />
