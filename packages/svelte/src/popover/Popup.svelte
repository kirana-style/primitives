<script lang="ts">
  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"

  let props = $props()
  const controller = usePopover()
</script>

<Part part={controller.popup} tag="div" {...props} />
