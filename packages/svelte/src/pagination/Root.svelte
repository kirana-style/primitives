<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createPagination } from "@kirana-ui/core/pagination"
  import type { PaginationProps } from "@kirana-ui/core/pagination"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  // `bind:page` is the page shown, from 1.
  let {
    page = $bindable(),
    defaultPage,
    onPageChange,
    count,
    pageSize,
    siblingCount,
    boundaryCount,
    disabled,
    id,
    ...rest
  }: RootProps<PaginationProps> = $props()
  const generated = $props.id()

  function change(next: number, by: ChangeDetails) {
    onPageChange?.(next, by)
    if (!by.canceled) page = next
  }

  const made = provide(
    controller(createPagination, () => ({
      id: id ?? generated,
      page,
      defaultPage,
      count,
      pageSize,
      siblingCount,
      boundaryCount,
      disabled,
      onPageChange: change,
    }))
  )
</script>

<Part part={made.root} tag="nav" {...rest} />
