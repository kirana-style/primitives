<script lang="ts">
  import Part from "../Part.svelte"
  import { useCarousel } from "./context.ts"
  import type { NextProps } from "./types.ts"

  let props: NextProps = $props()
  const controller = useCarousel()
</script>

<Part of={controller.next} tag="button" {...props} />
