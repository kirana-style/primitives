<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createNumberField } from "@kirana-ui/core/number-field"
  import type { NumberFieldProps } from "@kirana-ui/core/number-field"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller, fromSignal } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  // `bind:value` is the number, `null` for none.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    onValueCommitted,
    min,
    max,
    step,
    smallStep,
    largeStep,
    snapOnStep,
    allowWheelScrub,
    format,
    locale,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
    children,
    ...rest
  }: RootProps<NumberFieldProps> = $props()
  const generated = $props.id()

  function change(next: number | null, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(within(createNumberField, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      min,
      max,
      step,
      smallStep,
      largeStep,
      snapOnStep,
      allowWheelScrub,
      format,
      locale,
      disabled,
      readOnly,
      required,
      name,
      form,
      onValueChange: change,
      onValueCommitted: (next: number | null, by: ChangeDetails) => onValueCommitted?.(next, by),
    }))
  )
  const named = fromSignal(made.named)
</script>

<Part part={made.root} tag="div" {...rest}>
  {@render children?.()}
  {#if named.current}
    <Part part={made.hidden} tag="input" />
  {/if}
</Part>
