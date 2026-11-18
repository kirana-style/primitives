<script lang="ts">
  import Part from "../Part.svelte"
  import { useCarousel } from "./context.ts"
  import type { PreviousProps } from "./types.ts"

  let props: PreviousProps = $props()
  const controller = useCarousel()
</script>

<Part of={controller.previous} tag="button" {...props} />
