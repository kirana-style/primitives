<script lang="ts">
  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"
  import type { BackdropProps } from "./types.ts"

  let props: BackdropProps = $props()
  const controller = usePopover()
</script>

<Part of={controller.backdrop} tag="div" {...props} />
