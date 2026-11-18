<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createSwitch } from "@kirana-ui/core/switch"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let {
    checked = $bindable(),
    defaultChecked,
    onCheckedChange,
    disabled,
    readOnly,
    required,
    name,
    form,
    value,
    id,
    children,
    ...rest
  }: RootProps = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onCheckedChange?.(next, by)
    if (!by.canceled) checked = next
  }

  const made = provide(
    controller(within(createSwitch, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      checked,
      defaultChecked,
      disabled,
      readOnly,
      required,
      name,
      form,
      value,
      onCheckedChange: change,
    }))
  )
</script>

<!-- The native input is the part's own, not its content: with `child` the caller's element is
     the caller's to draw, so the snippet is given `input` to render inside it, last, where
     every other adapter keeps it. A snippet that leaves it out draws a control no form reads. -->
{#snippet input()}<Part of={made.input} tag="input" />{/snippet}

<Part of={made.root} tag="span" {...rest} held={{ input: input }}>
  {@render children?.()}<Part of={made.input} tag="input" />
</Part>
