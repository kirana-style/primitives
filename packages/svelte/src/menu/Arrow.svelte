<script lang="ts">
  import Part from "../Part.svelte"
  import { useMenu } from "./context.ts"
  import type { ArrowProps } from "./types.ts"

  let props: ArrowProps = $props()
  const controller = useMenu()
</script>

<Part of={controller.arrow} tag="div" {...props} />
