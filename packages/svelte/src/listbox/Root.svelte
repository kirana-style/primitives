<script lang="ts">
  import type { ListboxProps } from "@kirana-ui/core/listbox"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createListbox } from "@kirana-ui/core/listbox"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    multiple,
    disabled,
    loop,
    id,
    ...rest
  }: RootProps<ListboxProps> = $props()
  const generated = $props.id()

  function change(next: unknown[], by: ChangeDetails) {
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
      onValueChange: change,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
