<script lang="ts">
  import Part from "../Part.svelte"
  import { useScrollbar } from "./context.ts"
  import type { ThumbProps } from "./types.ts"

  let props: ThumbProps = $props()
  const bar = useScrollbar()
</script>

<Part of={bar.thumb} tag="div" {...props} />
