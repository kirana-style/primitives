<script lang="ts">
  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useCommand } from "./context.ts"
  import type { SeparatorProps } from "./types.ts"

  // A line between groups: gone while something is typed, unless `alwaysRender`.
  let { alwaysRender, ...rest }: SeparatorProps = $props()
  const options = toSignal(() => ({ alwaysRender }))
  const part = useCommand().separator(() => options.get().alwaysRender)
</script>

<Part of={part} tag="div" {...rest} />
