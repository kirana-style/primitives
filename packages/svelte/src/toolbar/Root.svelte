<script lang="ts">
  import { within } from "@kirana-ui/core"
  import { createToolbar } from "@kirana-ui/core/toolbar"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let { orientation, loop, loopFocus, disabled, ...rest }: RootProps = $props()
  const made = provide(
    controller(within(createToolbar, { direction: useDirectionAround() }), () => ({
      orientation,
      loop,
      loopFocus,
      disabled,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
