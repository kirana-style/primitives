<script lang="ts">
  import Part from "../Part.svelte"
  import { useHoverCard } from "./context.ts"
  import type { PopupProps } from "./types.ts"

  let props: PopupProps = $props()
  const controller = useHoverCard()
</script>

<Part of={controller.popup} tag="div" {...props} />
