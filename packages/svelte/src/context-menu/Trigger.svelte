<script lang="ts">
  import Part from "../Part.svelte"
  import { useMenu } from "../menu/context.ts"
  import type { TriggerProps } from "./types.ts"

  // The area a secondary press, or a long press on a touch screen, opens the menu in.
  let props: TriggerProps = $props()
  const controller = useMenu()
</script>

<Part of={controller.area} tag="div" {...props} />
