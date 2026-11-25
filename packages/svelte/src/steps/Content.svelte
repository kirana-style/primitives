<script lang="ts">
  import Part from "../Part.svelte"
  import { useSteps } from "./context.ts"
  import type { ContentProps } from "./types.ts"

  let { index, ...rest }: ContentProps = $props()
  const controller = useSteps()
</script>

<Part of={controller.content(index)} tag="div" {...rest} />
