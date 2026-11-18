<script lang="ts">
  import Part from "../Part.svelte"
  import { useScrollArea } from "./context.ts"
  import type { ContentProps } from "./types.ts"

  let props: ContentProps = $props()
  const controller = useScrollArea()
</script>

<Part of={controller.content} tag="div" {...props} />
