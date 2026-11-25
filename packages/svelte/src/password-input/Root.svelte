<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createPasswordInput } from "@kirana-ui/core/password-input"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  // `bind:visible` is whether the password can be read. Inside a `<Field.Root>` its input is
  // the field's control.
  let { visible = $bindable(), defaultVisible, onVisibleChange, disabled, onValueChange, ...rest }: RootProps = $props()

  function change(next: boolean, by: ChangeDetails) {
    onVisibleChange?.(next, by)
    if (!by.canceled) visible = next
  }

  const made = provide(
    controller(within(createPasswordInput, { field: useFieldAround() }), () => ({
      visible,
      defaultVisible,
      disabled,
      onVisibleChange: change,
      onValueChange: (next: string, by: ChangeDetails) => onValueChange?.(next, by),
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
