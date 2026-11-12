<script lang="ts">
  import Part from "../Part.svelte"
  import { useSlider } from "./context.ts"

  let props = $props()
  const controller = useSlider()
</script>

<Part part={controller.track} tag="div" {...props} />
