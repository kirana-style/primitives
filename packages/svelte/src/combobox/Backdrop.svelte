<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { BackdropProps } from "./types.ts"

  // What lies over the page behind the list: a sheet's (`presentation`) is modal.
  let props: BackdropProps = $props()
  const controller = useCombobox()
</script>

<Part of={controller.backdrop} tag="div" {...props} />
