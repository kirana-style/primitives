<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createEditable } from "@kirana-ui/core/editable"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  // `bind:value` is the text kept, `bind:editing` whether it is being edited.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    editing = $bindable(),
    defaultEditing,
    onEditingChange,
    placeholder,
    activation,
    submitOnBlur,
    selectOnFocus,
    disabled,
    readOnly,
    name,
    form,
    id,
    ...rest
  }: RootProps = $props()
  const generated = $props.id()

  function change(next: string, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  function changeEditing(next: boolean, by: ChangeDetails) {
    onEditingChange?.(next, by)
    if (!by.canceled) editing = next
  }

  const made = provide(
    controller(createEditable, () => ({
      id: id ?? generated,
      value,
      defaultValue,
      editing,
      defaultEditing,
      placeholder,
      activation,
      submitOnBlur,
      selectOnFocus,
      disabled,
      readOnly,
      name,
      form,
      onValueChange: change,
      onEditingChange: changeEditing,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
