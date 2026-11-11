<script lang="ts">
  import Part from "../Part.svelte"
  import { useSwitch } from "./context.ts"

  let props = $props()
  const controller = useSwitch()
</script>

<Part part={controller.thumb} tag="span" {...props} />
