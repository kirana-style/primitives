<script lang="ts">
  import type { OtpProps } from "@kirana-ui/core/otp"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createOtp } from "@kirana-ui/core/otp"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    length,
    value = $bindable(),
    defaultValue,
    onValueChange,
    onComplete,
    mode,
    disabled,
    name,
    form,
    id,
    ...rest
  }: RootProps<OtpProps> = $props()
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
      disabled,
      name,
      form,
      onValueChange: change,
      onComplete: (code: string) => onComplete?.(code),
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
