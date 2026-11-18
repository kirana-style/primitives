<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"
  import type { CloseProps } from "./types.ts"

  let props: CloseProps = $props()
  const controller = useDialog()
</script>

<Part of={controller.close} tag="button" {...props} />
