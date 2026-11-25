<script lang="ts">
  import Part from "../Part.svelte"
  import { useSelect } from "./context.ts"
  import type { BackdropProps } from "./types.ts"

  // What lies over the page behind the list: a sheet's (`presentation`) is modal.
  let props: BackdropProps = $props()
  const controller = useSelect()
</script>

<Part of={controller.backdrop} tag="div" {...props} />
