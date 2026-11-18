<script lang="ts">
  import Part from "../Part.svelte"
  import { useMeter } from "./context.ts"
  import type { TrackProps } from "./types.ts"

  let props: TrackProps = $props()
  const controller = useMeter()
</script>

<Part of={controller.track} tag="div" {...props} />
