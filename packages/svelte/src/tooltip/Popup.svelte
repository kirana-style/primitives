<script lang="ts">
  import Part from "../Part.svelte"
  import { useTooltip } from "./context.ts"
  import type { PopupProps } from "./types.ts"

  let props: PopupProps = $props()
  const controller = useTooltip()
</script>

<Part of={controller.popup} tag="div" {...props} />
