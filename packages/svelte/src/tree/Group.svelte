<script lang="ts">
  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useItem } from "./context.ts"
  import type { GroupProps } from "./types.ts"

  // `keepMounted` keeps the closed group in the page, `hidden`.
  let { keepMounted = false, ...rest }: GroupProps = $props()
  const item = useItem()
  const mounted = fromSignal(item.mounted)
</script>

{#if mounted.current || keepMounted}
  <Part of={item.group} tag="div" {...rest} />
{/if}
