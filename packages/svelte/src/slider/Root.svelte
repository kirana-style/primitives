<script lang="ts">
  import { createSlider } from "@kirana-ui/core/slider"
  import type { SliderChangeDetails } from "@kirana-ui/core/slider"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

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
    orientation,
    disabled,
    name,
    format,
    locale,
    getAriaValueText,
    id,
    ...rest
  } = $props()
  const generated = $props.id()

  function change(next: number | number[], by: SliderChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(createSlider, () => ({
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
      orientation,
      disabled,
      name,
      format,
      locale,
      getAriaValueText,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
