<script lang="ts">
  import Part from "../Part.svelte"
  import { useSteps } from "./context.ts"
  import type { PreviousProps } from "./types.ts"

  let props: PreviousProps = $props()
  const controller = useSteps()
</script>

<Part of={controller.previous} tag="button" {...props} />
