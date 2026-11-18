<script lang="ts">
  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"
  import type { ArrowProps } from "./types.ts"

  let props: ArrowProps = $props()
  const controller = usePopover()
</script>

<Part of={controller.arrow} tag="div" {...props} />
