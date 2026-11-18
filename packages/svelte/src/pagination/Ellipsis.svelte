<script lang="ts">
  import Part from "../Part.svelte"
  import { usePagination } from "./context.ts"
  import type { EllipsisProps } from "./types.ts"

  let props: EllipsisProps = $props()
  const controller = usePagination()
</script>

<Part of={controller.ellipsis} tag="span" {...props} />
