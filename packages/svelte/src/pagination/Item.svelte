<script lang="ts">
  import Part from "../Part.svelte"
  import { usePagination } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { page, ...rest }: { page: number } & PartAttributes = $props()
  const controller = usePagination()
</script>

<Part part={controller.item(page)} tag="button" {...rest} />
