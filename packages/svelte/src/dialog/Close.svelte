<script lang="ts">
  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useDialog } from "./context.ts"
  import type { CloseProps } from "./types.ts"

  let { disabled, ...rest }: CloseProps = $props()
  const options = toSignal(() => ({ disabled }))
  const part = useDialog().closePart(() => options.get())
</script>

<Part of={part} tag="button" {...rest} />
