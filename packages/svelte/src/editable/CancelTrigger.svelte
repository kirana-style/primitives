<script lang="ts">
  import Part from "../Part.svelte"
  import { useEditable } from "./context.ts"
  import type { CancelTriggerProps } from "./types.ts"

  let props: CancelTriggerProps = $props()
  const controller = useEditable()
</script>

<Part of={controller.cancelTrigger} tag="button" {...props} />
