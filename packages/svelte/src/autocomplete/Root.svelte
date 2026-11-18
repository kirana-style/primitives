<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createAutocomplete } from "@kirana-ui/core/autocomplete"

  import { provide } from "../combobox/context.ts"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import type { RootProps } from "./types.ts"

  // A combobox whose text is the value: `bind:value` is the text. The list only suggests.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    mode,
    filter,
    openOnInputClick,
    disabled,
    readOnly,
    items,
    required,
    name,
    form,
    virtualized,
    autoHighlight,
    id,
    children,
  }: RootProps = $props()
  const generated = $props.id()

  function changeValue(next: string, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  function changeOpen(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  provide(
    controller(within(createAutocomplete, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      open,
      defaultOpen,
      mode,
      filter,
      openOnInputClick,
      disabled,
      readOnly,
      items,
      required,
      name,
      form,
      virtualized,
      autoHighlight,
      onValueChange: changeValue,
      onOpenChange: changeOpen,
    }))
  )
</script>

{@render children?.()}
