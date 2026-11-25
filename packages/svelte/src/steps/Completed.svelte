<script lang="ts">
  import Part from "../Part.svelte"
  import { useSteps } from "./context.ts"
  import type { CompletedProps } from "./types.ts"

  let props: CompletedProps = $props()
  const controller = useSteps()
</script>

<Part of={controller.completed} tag="div" {...props} />
