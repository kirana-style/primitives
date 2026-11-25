<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { within } from "@kirana-ui/core"
  import { createTimeField } from "@kirana-ui/core/time-field"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    granularity,
    hourCycle,
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
  }: RootProps = $props()
  const generated = $props.id()

  function change(next: string | null, by: ChangeDetails) {
    onValueChange?.(next, by)
    // Written back only to a caller who holds it.
    if (!by.canceled && value !== undefined) value = next
  }

  const made = provide(
    controller(within(createTimeField, { direction: useDirectionAround(), field: useFieldAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      granularity,
      hourCycle,
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

<Part of={made.root} tag="div" {...rest} />
