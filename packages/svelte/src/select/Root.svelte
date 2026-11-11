<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createSelect } from "@kirana-ui/core/select"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    disabled,
    name,
    items,
    id,
    children,
  } = $props()
  const generated = $props.id()

  function changeValue(next: unknown, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  function changeOpen(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  const made = provide(
    controller(createSelect, () => ({
      id: id ?? generated,
      value,
      defaultValue,
      open,
      defaultOpen,
      disabled,
      name,
      items,
      onValueChange: changeValue,
      onOpenChange: changeOpen,
    }))
  )
</script>

{@render children?.()}
{#if name !== undefined}
  <Part part={made.input} tag="input" />
{/if}
