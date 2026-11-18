<script lang="ts">
  import Part from "../Part.svelte"
  import { usePagination } from "./context.ts"
  import type { PreviousProps } from "./types.ts"

  let props: PreviousProps = $props()
  const controller = usePagination()
</script>

<Part of={controller.previous} tag="button" {...props} />
