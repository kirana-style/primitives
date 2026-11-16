<script lang="ts">
  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useCommand } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // A line between groups: gone while something is typed, unless `alwaysRender`.
  let { alwaysRender, ...rest }: { alwaysRender?: boolean } & PartAttributes = $props()
  const options = toSignal(() => ({ alwaysRender }))
  const part = useCommand().separator(() => options.get().alwaysRender)
</script>

<Part {part} tag="div" {...rest} />
