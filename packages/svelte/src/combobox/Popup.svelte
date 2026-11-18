<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { PopupProps } from "./types.ts"

  let props: PopupProps = $props()
  const controller = useCombobox()
</script>

<Part of={controller.popup} tag="div" {...props} />
