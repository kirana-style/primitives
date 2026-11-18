<script lang="ts">
  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"
  import type { DescriptionProps } from "./types.ts"

  let props: DescriptionProps = $props()
  const controller = usePopover()
</script>

<Part of={controller.description} tag="p" {...props} />
