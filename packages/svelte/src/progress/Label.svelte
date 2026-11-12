<script lang="ts">
  import Part from "../Part.svelte"
  import { useProgress } from "./context.ts"

  let props = $props()
  const controller = useProgress()
</script>

<Part part={controller.label} tag="span" {...props} />
