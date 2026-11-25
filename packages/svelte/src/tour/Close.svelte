<script lang="ts">
  import Part from "../Part.svelte"
  import { useTour } from "./context.ts"
  import type { CloseProps } from "./types.ts"

  let props: CloseProps = $props()
  const part = useTour().close
</script>

<Part of={part} tag="button" {...props} />
