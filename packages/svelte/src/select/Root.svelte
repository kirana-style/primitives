<script lang="ts">
  import type { SelectProps } from "@kirana-ui/core/select"
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createSelect } from "@kirana-ui/core/select"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller, fromSignal } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    disabled,
    required,
    name,
    form,
    items,
    id,
    children,
  }: RootProps<SelectProps> = $props()
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
    controller(within(createSelect, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      open,
      defaultOpen,
      disabled,
      required,
      name,
      form,
      items,
      onValueChange: changeValue,
      onOpenChange: changeOpen,
    }))
  )
  const named = fromSignal(made.named)
</script>

{@render children?.()}
{#if named.current}
  <Part part={made.input} tag="input" />
{/if}
