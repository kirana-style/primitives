<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"
  import type { PopupProps } from "./types.ts"

  let props: PopupProps = $props()
  const controller = useDialog()
</script>

<Part of={controller.popup} tag="div" {...props} />
