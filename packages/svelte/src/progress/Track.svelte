<script lang="ts">
  import Part from "../Part.svelte"
  import { useProgress } from "./context.ts"
  import type { TrackProps } from "./types.ts"

  let props: TrackProps = $props()
  const controller = useProgress()
</script>

<Part of={controller.track} tag="div" {...props} />
