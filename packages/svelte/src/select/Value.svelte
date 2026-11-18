<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useSelect } from "./context.ts"
  import type { ValueProps } from "./types.ts"

  // `placeholder` shows while nothing is chosen. `children`, a snippet, draws something else
  // than the label: it is given what is chosen (`value` and `label`; with `multiple`, `values`
  // and `labels`, in the items' order).
  let {
    placeholder = "",
    children,
    ...rest
  }: ValueProps = $props()
  const controller = useSelect()
  const shown = fromSignal(controller.shown)
</script>

<!-- The text is the part's own, not its content: with `child` the snippet is given it as
     `text`, to render inside the caller's element. -->
{#snippet written()}{#if children}{@render children(shown.current)}{:else}{shown.current.label ?? placeholder}{/if}{/snippet}

<Part of={controller.valuePart} tag="span" {...rest} held={{ text: written }}>{@render written()}</Part>
