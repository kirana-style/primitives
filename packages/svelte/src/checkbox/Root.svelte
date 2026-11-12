<script lang="ts">
  import type { CheckboxProps } from "@kirana-ui/core/checkbox"
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createCheckbox } from "@kirana-ui/core/checkbox"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    checked = $bindable(),
    defaultChecked,
    onCheckedChange,
    indeterminate,
    disabled,
    readOnly,
    required,
    name,
    value,
    id,
    children,
    ...rest
  }: RootProps<CheckboxProps> = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onCheckedChange?.(next, by)
    if (!by.canceled) checked = next
  }

  const made = provide(
    controller(within(createCheckbox, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      checked,
      defaultChecked,
    indeterminate,
      disabled,
      readOnly,
      required,
      name,
      value,
      onCheckedChange: change,
    }))
  )
</script>

<Part part={made.root} tag="span" {...rest}>
  {@render children?.()}<Part part={made.input} tag="input" />
</Part>
