<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useToolbar } from "./context.ts"
  import type { ButtonProps } from "./types.ts"

  let { disabled, focusableWhenDisabled, ...rest }: ButtonProps = $props()
  const options = toSignal(() => ({ disabled, focusableWhenDisabled }))
  const part = useToolbar().button(() => defined(options.get()))
</script>

<Part of={part} tag="button" {...rest} />
