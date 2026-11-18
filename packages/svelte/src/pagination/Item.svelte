<script lang="ts">
  import Part from "../Part.svelte"
  import { usePagination } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  let { page, ...rest }: ItemProps = $props()
  const controller = usePagination()
</script>

<Part of={controller.item(page)} tag="button" {...rest} />
