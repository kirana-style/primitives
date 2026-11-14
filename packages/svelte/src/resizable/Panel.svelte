<script lang="ts">
  import type { ResizablePanelOptions } from "@kirana-ui/core/resizable"
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useResizable } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { defaultSize, minSize, maxSize, ...rest }: ResizablePanelOptions & PartAttributes = $props()
  const options = toSignal(() => ({ defaultSize, minSize, maxSize }))
  const part = useResizable().panel(() => defined(options.get()))
</script>

<Part {part} tag="div" {...rest} />
