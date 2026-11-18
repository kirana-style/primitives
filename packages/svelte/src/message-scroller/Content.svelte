<script lang="ts">
  import Part from "../Part.svelte"
  import { useScroller } from "./context.ts"
  import type { ContentProps } from "./types.ts"

  let props: ContentProps = $props()
  const controller = useScroller()
</script>

<Part of={controller.content} tag="div" {...props} />
