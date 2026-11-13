<script lang="ts">
  import type { SwitchProps } from "@kirana-ui/core/switch"
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createSwitch } from "@kirana-ui/core/switch"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    checked = $bindable(),
    defaultChecked,
    onCheckedChange,
    disabled,
    readOnly,
    required,
    name,
    form,
    value,
    id,
    children,
    ...rest
  }: RootProps<SwitchProps> = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onCheckedChange?.(next, by)
    if (!by.canceled) checked = next
  }

  const made = provide(
    controller(within(createSwitch, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      checked,
      defaultChecked,
      disabled,
      readOnly,
      required,
      name,
      form,
      value,
      onCheckedChange: change,
    }))
  )
</script>

<Part part={made.root} tag="span" {...rest}>
  {@render children?.()}<Part part={made.input} tag="input" />
</Part>
