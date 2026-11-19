<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createOtp } from "@kirana-ui/core/otp"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let {
    length,
    value = $bindable(),
    defaultValue,
    onValueChange,
    onComplete,
    mode,
    pattern,
    disabled,
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
    controller(createOtp, () => ({
      id: id ?? generated,
      length,
      value,
      defaultValue,
      mode,
      pattern,
      disabled,
      name,
      form,
      onValueChange: change,
      onComplete: (code: string) => onComplete?.(code),
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
