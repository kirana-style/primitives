<script lang="ts" generics="Value">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createTree } from "@kirana-ui/core/tree"
  import type { Tree } from "@kirana-ui/core/tree"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide, provideLevel } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let {
    expandedValue = $bindable(),
    defaultExpandedValue,
    onExpandedChange,
    selectionMode,
    selectedValue = $bindable(),
    defaultSelectedValue,
    onSelectedChange,
    expandOnClick,
    id,
    ...rest
  }: RootProps<Value> = $props()
  const generated = $props.id()

  function expand(next: Value[], by: ChangeDetails) {
    onExpandedChange?.(next, by)
    if (!by.canceled) expandedValue = next
  }

  function select(next: Value[], by: ChangeDetails) {
    onSelectedChange?.(next, by)
    if (!by.canceled) selectedValue = next
  }

  const made = controller(within(createTree<Value>, { direction: useDirectionAround() }), () => ({
    id: id ?? generated,
    expandedValue,
    defaultExpandedValue,
    onExpandedChange: expand,
    selectionMode,
    selectedValue,
    defaultSelectedValue,
    onSelectedChange: select,
    expandOnClick,
  }))
  provide(made as Tree)
  provideLevel(0)
</script>

<Part of={made.root} tag="div" {...rest} />
