<script lang="ts">
  import type { ComboboxProps } from "@kirana-ui/core/combobox"
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createCombobox } from "@kirana-ui/core/combobox"

  import { useFieldAround } from "../field/context.ts"

  import Part from "../Part.svelte"
  import { controller, fromSignal } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    inputValue = $bindable(),
    defaultInputValue,
    onInputValueChange,
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    disabled,
    name,
    form,
    items,
    filter,
    required,
    multiple,
    values = $bindable(),
    defaultValues,
    onValuesChange,
    inline,
    virtualized,
    id,
    children,
  }: RootProps<ComboboxProps> = $props()
  const generated = $props.id()

  function changeValue(next: unknown, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  function changeInput(next: string, by: ChangeDetails) {
    onInputValueChange?.(next, by)
    if (!by.canceled) inputValue = next
  }

  function changeValues(next: unknown[], by: ChangeDetails) {
    onValuesChange?.(next, by)
    if (!by.canceled) values = next
  }

  function changeOpen(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  const made = provide(
    controller(within(createCombobox, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      inputValue,
      defaultInputValue,
      open,
      defaultOpen,
      disabled,
      name,
      form,
      items,
      filter,
      required,
      multiple,
      values,
      defaultValues,
      onValuesChange: changeValues,
      inline,
      virtualized,
      onValueChange: changeValue,
      onInputValueChange: changeInput,
      onOpenChange: changeOpen,
    }))
  )
  const named = fromSignal(made.named)
</script>

{@render children?.()}
{#if named.current}
  <Part part={made.hidden} tag="input" />
{/if}
