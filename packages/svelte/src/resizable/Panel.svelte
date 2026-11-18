<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useResizable } from "./context.ts"
  import type { PanelProps } from "./types.ts"

  let { defaultSize, minSize, maxSize, ...rest }: PanelProps = $props()
  const options = toSignal(() => ({ defaultSize, minSize, maxSize }))
  const part = useResizable().panel(() => defined(options.get()))
</script>

<Part of={part} tag="div" {...rest} />
