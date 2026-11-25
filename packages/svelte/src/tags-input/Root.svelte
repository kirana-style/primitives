<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createTagsInput } from "@kirana-ui/core/tags-input"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  // `bind:value` is the tags.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    onValueInvalid,
    validate,
    max,
    allowDuplicates,
    delimiter,
    addOnBlur,
    addOnPaste,
    editable,
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

  function change(next: string[], by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(within(createTagsInput, { field: useFieldAround(), direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      onValueInvalid,
      validate,
      max,
      allowDuplicates,
      delimiter,
      addOnBlur,
      addOnPaste,
      editable,
      disabled,
      readOnly,
      required,
      name,
      form,
      onValueChange: change,
    }))
  )
</script>

<!-- The hidden input is the part's own, not its content: with `child` the caller's element is
     the caller's to draw, so the snippet is given `input` to render inside it, last, where
     every other adapter keeps it. The rest of the tags' inputs follow it, drawn by the
     component. -->
{#snippet input()}<Part of={made.hiddenInput} tag="input" />{/snippet}

<Part of={made.root} tag="div" {...rest} held={{ input }}>
  {@render children?.()}<Part of={made.hiddenInput} tag="input" />
</Part>
