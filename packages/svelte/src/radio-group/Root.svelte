<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createRadioGroup } from "@kirana-ui/core/radio-group"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    disabled,
    readOnly,
    required,
    name,
    id,
    ...rest
  } = $props()
  const generated = $props.id()

  function change(next: unknown, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(createRadioGroup, () => ({
      id: id ?? generated,
      value,
      defaultValue,
      disabled,
      readOnly,
      required,
      name,
      onValueChange: change,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
