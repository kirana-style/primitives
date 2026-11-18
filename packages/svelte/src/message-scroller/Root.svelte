<script lang="ts">
  import { createMessageScroller } from "@kirana-ui/core/message-scroller"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let { initial, threshold, onAtBottomChange, id, ...rest }: RootProps = $props()
  const generated = $props.id()
  const made = provide(
    controller(createMessageScroller, () => ({
      id: id ?? generated,
      initial,
      threshold,
      onAtBottomChange,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
