<script lang="ts" generics="Value extends SliderValue = number">
  import { within } from "@kirana-ui/core"
  import { createSlider } from "@kirana-ui/core/slider"
  import type { SliderChangeDetails, SliderTold, SliderValue } from "@kirana-ui/core/slider"

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
    onValueCommitted,
    min,
    max,
    step,
    largeStep,
    minStepsBetweenValues,
    thumbAlignment,
    orientation,
    disabled,
    readOnly,
    name,
    form,
    format,
    locale,
    getAriaValueText,
    id,
    ...rest
  }: RootProps<Value> = $props()
  const generated = $props.id()

  // Given neither `value` nor `defaultValue`, a slider has one thumb: its value is a number.
  function change(next: SliderTold<Value>, by: SliderChangeDetails) {
    onValueChange?.(next, by)
    // What is told is the kind that was given.
    if (!by.canceled) value = next as unknown as Value
  }

  const made = provide(
    controller(within(createSlider<Value>, { field: useFieldAround(), direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      onValueChange: change,
      onValueCommitted,
      min,
      max,
      step,
      largeStep,
      minStepsBetweenValues,
      thumbAlignment,
      orientation,
      disabled,
      readOnly,
      name,
      form,
      format,
      locale,
      getAriaValueText,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
