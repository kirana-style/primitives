<script lang="ts" generics="Value, Multiple extends boolean | undefined = false">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createCombobox } from "@kirana-ui/core/combobox"

  import { useDirectionAround } from "../direction/context.ts"
  import { useFieldAround } from "../field/context.ts"

  import Part from "../Part.svelte"
  import { controller, fromSignal } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

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
    readOnly,
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
    presentation,
    sheetBelow,
    autoHighlight,
    itemToStringLabel,
    itemToStringValue,
    id,
    children,
  }: RootProps<Value, Multiple> = $props()
  const generated = $props.id()

  type Given = RootProps<Value, Multiple>

  function changeValue(next: Value | Value[] | null, by: ChangeDetails) {
    // With `multiple` the core tells the list here, as Base UI's `onValueChange` is told it.
    if (multiple && Array.isArray(next)) return changeValues(next, by)
    onValueChange?.(next as Parameters<NonNullable<Given["onValueChange"]>>[0], by)
    if (!by.canceled) value = next as Given["value"]
  }

  function changeInput(next: string, by: ChangeDetails) {
    onInputValueChange?.(next, by)
    if (!by.canceled) inputValue = next
  }

  function changeValues(next: Value[], by: ChangeDetails) {
    // Base UI's callback first, the one called when both are given; then the older one.
    if (onValueChange) onValueChange(next as Parameters<NonNullable<Given["onValueChange"]>>[0], by)
    else onValuesChange?.(next, by)
    if (by.canceled) return
    // Written back to what the caller holds: the older `values` only when it holds that alone.
    if (values !== undefined && value === undefined) values = next
    else value = next as Given["value"]
  }

  function changeOpen(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  const made = provide(
    controller(
      within(createCombobox, { field: useFieldAround(), direction: useDirectionAround() }),
      () => ({
        id: id ?? generated,
        value,
        defaultValue,
        inputValue,
        defaultInputValue,
        open,
        defaultOpen,
        disabled,
        readOnly,
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
        presentation,
        sheetBelow,
        autoHighlight,
        itemToStringLabel,
        itemToStringValue,
        onValueChange: changeValue,
        onInputValueChange: changeInput,
        onOpenChange: changeOpen,
      })
    )
  )
  const named = fromSignal(made.named)
</script>

{@render children?.()}
{#if named.current}
  <Part of={made.hidden} tag="input" />
{/if}
