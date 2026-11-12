<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useTabs } from "./context.ts"

  let { value, disabled, ...rest } = $props()
  const options = toSignal(() => ({ disabled }))
  // A tab is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useTabs().tab(value, () => defined(options.get()))
</script>

<Part {part} tag="button" {...rest} />
