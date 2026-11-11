<script lang="ts">
  import Part from "../Part.svelte"
  import { useCollapsible } from "./context.ts"

  let props = $props()
  const controller = useCollapsible()
</script>

<Part part={controller.trigger} tag="button" {...props} />
