<script lang="ts">
  import Part from "../Part.svelte"
  import { useMeter } from "./context.ts"

  let props = $props()
  const controller = useMeter()
</script>

<Part part={controller.indicator} tag="div" {...props} />
