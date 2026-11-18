<script lang="ts">
  import Part from "../Part.svelte"
  import { useSwitch } from "./context.ts"
  import type { ThumbProps } from "./types.ts"

  let props: ThumbProps = $props()
  const controller = useSwitch()
</script>

<Part of={controller.thumb} tag="span" {...props} />
