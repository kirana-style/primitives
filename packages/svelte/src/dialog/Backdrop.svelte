<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"
  import type { BackdropProps } from "./types.ts"

  let props: BackdropProps = $props()
  const controller = useDialog()
</script>

<Part of={controller.backdrop} tag="div" {...props} />
