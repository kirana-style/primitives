<script lang="ts">
  import Part from "../Part.svelte"
  import { useParts } from "./context.ts"
  import type { ContentProps } from "./types.ts"

  let props: ContentProps = $props()
  const controller = useParts()
</script>

<Part of={controller.content} tag="div" {...props} />
