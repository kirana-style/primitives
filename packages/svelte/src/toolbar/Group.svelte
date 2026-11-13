<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useToolbar } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { disabled, ...rest }: { disabled?: boolean } & PartAttributes = $props()
  const options = toSignal(() => ({ disabled }))
  const part = useToolbar().group(() => defined(options.get()))
</script>

<Part {part} tag="div" {...rest} />
