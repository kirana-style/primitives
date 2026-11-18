<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let props: TriggerProps = $props()
  const controller = useDialog()
</script>

<Part of={controller.trigger} tag="button" {...props} />
