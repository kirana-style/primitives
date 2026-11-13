<script lang="ts">
  import type { RadioGroupProps } from "@kirana-ui/core/radio-group"
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createRadioGroup } from "@kirana-ui/core/radio-group"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
    ...rest
  }: RootProps<RadioGroupProps> = $props()
  const generated = $props.id()

  function change(next: unknown, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(within(createRadioGroup, { field: useFieldAround(), direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      disabled,
      readOnly,
      required,
      name,
      form,
      onValueChange: change,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
