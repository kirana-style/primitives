<script lang="ts">
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal, toSignal } from "../runtime.svelte.ts"
  import { useField } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // What is wrong, or `children` in its place. In the page while it applies. `match` is one of
  // the browser's findings ("valueMissing") to show for only that, or `true` to show always.
  let { match, children, ...rest }: PartAttributes = $props()
  const options = toSignal(() => ({ match }))
  const error = useField().error(() => options.get().match)
  $effect(() => untrack(() => error.mount()))
  const mounted = fromSignal(error.mounted)
  const text = fromSignal(error.text)
</script>

{#if mounted.current}
  <Part part={error.part} tag="div" {...rest}>
    {#if children}{@render children()}{:else}{text.current}{/if}
  </Part>
{/if}
