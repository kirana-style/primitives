<script lang="ts">
  import Part from "../Part.svelte"
  import { useEditable } from "./context.ts"
  import type { SubmitTriggerProps } from "./types.ts"

  let props: SubmitTriggerProps = $props()
  const controller = useEditable()
</script>

<Part of={controller.submitTrigger} tag="button" {...props} />
