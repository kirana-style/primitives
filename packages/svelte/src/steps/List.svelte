<script lang="ts">
  import Part from "../Part.svelte"
  import { useSteps } from "./context.ts"
  import type { ListProps } from "./types.ts"

  let props: ListProps = $props()
  const controller = useSteps()
</script>

<Part of={controller.list} tag="div" {...props} />
