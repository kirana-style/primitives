<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useMenu } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  let { disabled, label, closeOnSelect, closeOnClick, ...rest }: ItemProps = $props()
  const options = toSignal(() => ({ disabled, label, closeOnSelect, closeOnClick }))
  const part = useMenu().item(() => defined(options.get()))
</script>

<Part of={part} tag="div" {...rest} />
