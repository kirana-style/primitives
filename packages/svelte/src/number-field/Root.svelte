<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createNumberField } from "@kirana-ui/core/number-field"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller, fromSignal } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

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
  }: RootProps = $props()
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

<!-- The hidden input is the part's own, not its content: with `child` the caller's element is
     the caller's to draw, so the snippet is given `input` to render inside it, last, where
     every other adapter keeps it. It draws nothing while the field has no name. -->
{#snippet input()}
  {#if named.current}
    <Part of={made.hidden} tag="input" />
  {/if}
{/snippet}

<Part of={made.root} tag="div" {...rest} held={{ input }}>
  {@render children?.()}
  {#if named.current}
    <Part of={made.hidden} tag="input" />
  {/if}
</Part>
