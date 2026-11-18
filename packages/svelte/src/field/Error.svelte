<script lang="ts">
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { fromSignal, toSignal } from "../runtime.svelte.ts"
  import { useField } from "./context.ts"
  import type { ErrorProps } from "./types.ts"

  // What is wrong, or `children` in its place. In the page while it applies. `match` is one of
  // the browser's findings ("valueMissing") to show for only that, or `true` to show always.
  let { match, children, ...rest }: ErrorProps = $props()
  const options = toSignal(() => ({ match }))
  const error = useField().error(() => options.get().match)
  $effect(() => untrack(() => error.mount()))
  const mounted = fromSignal(error.mounted)
  const text = fromSignal(error.text)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{#if children}{@render children()}{:else}{text.current}{/if}{/snippet}

{#if mounted.current}
  <Part of={error.part} tag="div" {...rest} held={{ text: written }}>{@render written()}</Part>
{/if}
