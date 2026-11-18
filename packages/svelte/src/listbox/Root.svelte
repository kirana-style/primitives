<script lang="ts" generics="Value">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createListbox } from "@kirana-ui/core/listbox"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    multiple,
    disabled,
    loop,
    name,
    form,
    virtualized,
    id,
    ...rest
  }: RootProps<Value> = $props()
  const generated = $props.id()

  function change(next: Value[], by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(createListbox, () => ({
      id: id ?? generated,
      value,
      defaultValue,
      multiple,
      disabled,
      loop,
      name,
      form,
      virtualized,
      onValueChange: change,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
