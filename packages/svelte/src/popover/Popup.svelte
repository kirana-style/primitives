<script lang="ts">
  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"
  import type { PopupProps } from "./types.ts"

  let props: PopupProps = $props()
  const controller = usePopover()
</script>

<Part of={controller.popup} tag="div" {...props} />
