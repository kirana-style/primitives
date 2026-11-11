<script lang="ts">
  import Part from "../Part.svelte"
  import { useSelect } from "./context.ts"

  let props = $props()
  const controller = useSelect()
</script>

<Part part={controller.popup} tag="div" {...props} />
