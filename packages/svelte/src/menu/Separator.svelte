<script lang="ts">
  import Part from "../Part.svelte"
  import { useMenu } from "./context.ts"
  import type { SeparatorProps } from "./types.ts"

  let props: SeparatorProps = $props()
  const controller = useMenu()
</script>

<Part of={controller.separator} tag="div" {...props} />
