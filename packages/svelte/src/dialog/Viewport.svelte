<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"
  import type { ViewportProps } from "./types.ts"

  // What a long dialog scrolls in, around its popup: it may be left out.
  let props: ViewportProps = $props()
  const controller = useDialog()
</script>

<Part of={controller.viewport} tag="div" {...props} />
