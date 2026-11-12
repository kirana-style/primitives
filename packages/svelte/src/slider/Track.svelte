<script lang="ts">
  import Part from "../Part.svelte"
  import { useSlider } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useSlider()
</script>

<Part part={controller.track} tag="div" {...props} />
