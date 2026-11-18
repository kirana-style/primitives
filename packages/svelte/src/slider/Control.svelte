<script lang="ts">
  import Part from "../Part.svelte"
  import { useSlider } from "./context.ts"
  import type { ControlProps } from "./types.ts"

  let props: ControlProps = $props()
  const controller = useSlider()
</script>

<Part of={controller.control} tag="div" {...props} />
