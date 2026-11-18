<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createCheckboxGroup } from "@kirana-ui/core/checkbox-group"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { CheckboxGroupProps } from "./types.ts"

  // Checkboxes that hold one list of values. Each `<Checkbox.Root value>` inside it is checked
  // while the list has its value; with `allValues`, a `<Checkbox.Root parent>` stands for them all.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    allValues,
    disabled,
    id,
    ...rest
  }: CheckboxGroupProps = $props()
  const generated = $props.id()

  function change(next: string[], by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(within(createCheckboxGroup, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      allValues,
      disabled,
      onValueChange: change,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
