<script lang="ts">
  import Part from "../Part.svelte"
  import { useTour } from "./context.ts"
  import type { NextProps } from "./types.ts"

  let props: NextProps = $props()
  const part = useTour().next
</script>

<Part of={part} tag="button" {...props} />
