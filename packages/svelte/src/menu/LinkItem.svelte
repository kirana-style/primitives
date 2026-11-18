<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useMenu } from "./context.ts"
  import type { LinkItemProps } from "./types.ts"

  // An item that is a link: `href` and the rest go to its `<a>`.
  let { disabled, label, closeOnClick, ...rest }: LinkItemProps = $props()
  const options = toSignal(() => ({ disabled, label, closeOnClick }))
  const part = useMenu().item(() => defined(options.get()))
</script>

<Part of={part} tag="a" {...rest} />
