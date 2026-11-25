<script lang="ts">
  import Part from "../Part.svelte"
  import { useSteps } from "./context.ts"
  import type { NextProps } from "./types.ts"

  let props: NextProps = $props()
  const controller = useSteps()
</script>

<Part of={controller.next} tag="button" {...props} />
