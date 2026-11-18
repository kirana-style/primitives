<script lang="ts">
  import Part from "../Part.svelte"
  import { usePopover } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let props: TriggerProps = $props()
  const controller = usePopover()
</script>

<Part of={controller.trigger} tag="button" {...props} />
