<script lang="ts">
  import type { MessageScrollerProps } from "@kirana-ui/core/message-scroller"
  import { createMessageScroller } from "@kirana-ui/core/message-scroller"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let { initial, threshold, onAtBottomChange, id, ...rest }: RootProps<MessageScrollerProps> =
    $props()
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

<Part part={made.root} tag="div" {...rest} />
