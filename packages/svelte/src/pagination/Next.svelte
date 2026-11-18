<script lang="ts">
  import Part from "../Part.svelte"
  import { usePagination } from "./context.ts"
  import type { NextProps } from "./types.ts"

  let props: NextProps = $props()
  const controller = usePagination()
</script>

<Part of={controller.next} tag="button" {...props} />
