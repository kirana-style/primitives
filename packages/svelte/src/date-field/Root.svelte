<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import type { DateFieldProps } from "@kirana-ui/core/date-field"
  import { within } from "@kirana-ui/core"
  import { createDateField } from "@kirana-ui/core/date-field"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    locale,
    min,
    max,
    placeholders,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
    ...rest
  }: RootProps<DateFieldProps> = $props()
  const generated = $props.id()

  function change(next: string | null, by: ChangeDetails) {
    onValueChange?.(next, by)
    // Written back only to a caller who holds it.
    if (!by.canceled && value !== undefined) value = next
  }

  const made = provide(
    controller(within(createDateField, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      locale,
      min,
      max,
      placeholders,
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
