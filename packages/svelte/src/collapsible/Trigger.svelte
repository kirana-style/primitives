<script lang="ts">
  import Part from "../Part.svelte"
  import { useCollapsible } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let props: TriggerProps = $props()
  const controller = useCollapsible()
</script>

<Part of={controller.trigger} tag="button" {...props} />
