<script lang="ts">
  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"
  import type { TitleProps } from "./types.ts"

  let props: TitleProps = $props()
  const controller = usePopover()
</script>

<Part of={controller.title} tag="h2" {...props} />
