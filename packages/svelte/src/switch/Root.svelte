<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createSwitch } from "@kirana-ui/core/switch"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  let {
    checked = $bindable(),
    defaultChecked,
    onCheckedChange,
    disabled,
    readOnly,
    required,
    name,
    value,
    id,
    children,
    ...rest
  } = $props()
  const generated = $props.id()

  function change(next: boolean, by: ChangeDetails) {
    onCheckedChange?.(next, by)
    if (!by.canceled) checked = next
  }

  const made = provide(
    controller(createSwitch, () => ({
      id: id ?? generated,
      checked,
      defaultChecked,
      disabled,
      readOnly,
      required,
      name,
      value,
      onCheckedChange: change,
    }))
  )
</script>

<Part part={made.root} tag="span" {...rest}>
  {@render children?.()}<Part part={made.input} tag="input" />
</Part>
