<script lang="ts">
  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useItem } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let { disabled, ...rest }: TriggerProps = $props()
  const options = toSignal(() => ({ disabled }))
  const part = useItem().triggerPart(() => options.get())
</script>

<Part of={part} tag="button" {...rest} />
