<script lang="ts">
  import Part from "../Part.svelte"
  import { useMenu } from "../menu/context.ts"
  import type { PartAttributes } from "../types.ts"

  // The area a secondary press, or a long press on a touch screen, opens the menu in.
  let props: PartAttributes = $props()
  const controller = useMenu()
</script>

<Part part={controller.area} tag="div" {...props} />
