<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createColorPicker } from "@kirana-ui/core/color-picker"
  import type { ColorFormat } from "@kirana-ui/core/color-picker"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  // `bind:value` is the colour as it is written, `bind:format` the format it is written in.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    onValueCommitted,
    format = $bindable(),
    defaultFormat,
    onFormatChange,
    alpha,
    thumbAlignment,
    disabled,
    readOnly,
    required,
    name,
    form,
    getAriaValueText,
    id,
    children,
    ...rest
  }: RootProps = $props()
  const generated = $props.id()

  function change(next: string, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  function reformat(next: ColorFormat, by: ChangeDetails) {
    onFormatChange?.(next, by)
    if (!by.canceled) format = next
  }

  const made = provide(
    controller(
      within(createColorPicker, { field: useFieldAround(), direction: useDirectionAround() }),
      () => ({
        id: id ?? generated,
        value,
        defaultValue,
        onValueChange: change,
        onValueCommitted: (next: string, by: ChangeDetails) => onValueCommitted?.(next, by),
        format,
        defaultFormat,
        onFormatChange: reformat,
        alpha,
        thumbAlignment,
        disabled,
        readOnly,
        required,
        name,
        form,
        getAriaValueText,
      })
    )
  )
</script>

<!-- The hidden input is the part's own, not its content: with `child` the caller's element is
     the caller's to draw, so the snippet is given `input` to render inside it, last, where
     every other adapter keeps it. -->
{#snippet input()}<Part of={made.input} tag="input" />{/snippet}

<Part of={made.root} tag="div" {...rest} held={{ input }}>
  {@render children?.()}<Part of={made.input} tag="input" />
</Part>
