<script lang="ts">
  import type { TabOptions } from "@kirana-ui/core/tabs"
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useTabs } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { value, disabled, ...rest }: { value: unknown } & TabOptions & PartAttributes = $props()
  const options = toSignal(() => ({ disabled }))
  // A tab is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useTabs().tab(value, () => defined(options.get()))
</script>

<Part {part} tag="button" {...rest} />
