<script lang="ts">
  import Part from "../Part.svelte"
  import { usePasswordInput } from "./context.ts"
  import type { IndicatorProps } from "./types.ts"

  let props: IndicatorProps = $props()
  const controller = usePasswordInput()
</script>

<Part of={controller.indicator} tag="span" {...props} />
