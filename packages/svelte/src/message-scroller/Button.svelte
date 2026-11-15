<script lang="ts">
  import Part from "../Part.svelte"
  import { useScroller } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useScroller()
</script>

<Part part={controller.button} tag="button" {...props} />
