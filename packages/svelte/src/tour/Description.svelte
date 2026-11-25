<script lang="ts">
  import Part from "../Part.svelte"
  import { useTour } from "./context.ts"
  import type { DescriptionProps } from "./types.ts"

  let props: DescriptionProps = $props()
  const part = useTour().description
</script>

<Part of={part} tag="p" {...props} />
