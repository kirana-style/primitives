<script lang="ts">
  import Part from "../Part.svelte"
  import { useEditable } from "./context.ts"
  import type { EditTriggerProps } from "./types.ts"

  let props: EditTriggerProps = $props()
  const controller = useEditable()
</script>

<Part of={controller.editTrigger} tag="button" {...props} />
