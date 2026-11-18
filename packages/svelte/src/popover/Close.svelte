<script lang="ts">
  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"
  import type { CloseProps } from "./types.ts"

  let props: CloseProps = $props()
  const controller = usePopover()
</script>

<Part of={controller.close} tag="button" {...props} />
