<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createAccordion } from "@kirana-ui/core/accordion"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    multiple,
    disabled,
    orientation,
    loop,
    id,
    ...rest
  } = $props()
  const generated = $props.id()

  function change(next: unknown[], by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(within(createAccordion, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      multiple,
      disabled,
      orientation,
      loop,
      onValueChange: change,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
