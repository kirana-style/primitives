<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createOtp } from "@kirana-ui/core/otp"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let {
    length,
    value = $bindable(),
    defaultValue,
    onValueChange,
    onValueComplete,
    onComplete,
    validationType,
    mode,
    pattern,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
    ...rest
  }: RootProps = $props()
  const generated = $props.id()

  function change(next: string, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  const made = provide(
    controller(within(createOtp, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      length,
      value,
      defaultValue,
      validationType,
      mode,
      pattern,
      disabled,
      readOnly,
      required,
      name,
      form,
      onValueChange: change,
      onValueComplete,
      onComplete,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
