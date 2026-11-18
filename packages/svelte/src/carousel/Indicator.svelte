<script lang="ts">
  import Part from "../Part.svelte"
  import { useCarousel } from "./context.ts"
  import type { IndicatorProps } from "./types.ts"

  let { index, ...rest }: IndicatorProps = $props()
  // A button is its slide for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useCarousel().indicator(index)
</script>

<Part of={part} tag="button" {...rest} />
