<script lang="ts">
  import Part from "../Part.svelte"
  import { useFileUpload } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let props: TriggerProps = $props()
  const controller = useFileUpload()
</script>

<Part of={controller.trigger} tag="button" {...props} />
