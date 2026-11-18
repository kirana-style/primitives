<script lang="ts">
  import Part from "../Part.svelte"
  import { useSlider } from "./context.ts"
  import type { TrackProps } from "./types.ts"

  let props: TrackProps = $props()
  const controller = useSlider()
</script>

<Part of={controller.track} tag="div" {...props} />
