<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useResizable } from "./context.ts"
  import type { HandleProps } from "./types.ts"

  let { disabled, ...rest }: HandleProps = $props()
  const options = toSignal(() => ({ disabled }))
  const part = useResizable().handle(() => defined(options.get()))
</script>

<Part of={part} tag="div" {...rest} />
