<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useToolbar } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let { disabled, ...rest }: InputProps = $props()
  const options = toSignal(() => ({ disabled }))
  const part = useToolbar().input(() => defined(options.get()))
</script>

<Part of={part} tag="input" {...rest} />
