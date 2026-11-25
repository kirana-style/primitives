<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createRating } from "@kirana-ui/core/rating"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  // `bind:value` is how much is given, from 0 to `count`.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    onHoverChange,
    count,
    allowHalf,
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

  function change(next: number, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(within(createRating, { field: useFieldAround(), direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      count,
      allowHalf,
      disabled,
      readOnly,
      required,
      name,
      form,
      onValueChange: change,
      onHoverChange: (next: number | null) => onHoverChange?.(next),
    }))
  )
</script>

<!-- The hidden input is the part's own, not its content: with `child` the caller's element is
     the caller's to draw, so the snippet is given `input` to render inside it, last, where
     every other adapter keeps it. -->
{#snippet input()}<Part of={made.input} tag="input" />{/snippet}

<Part of={made.root} tag="div" {...rest} held={{ input }}>
  {@render children?.()}<Part of={made.input} tag="input" />
</Part>
