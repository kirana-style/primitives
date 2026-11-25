<script lang="ts" generics="Step extends TourStep = TourStep">
  import type { TourStep } from "@kirana-ui/core/tour"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useTour } from "./context.ts"
  import type { PopupProps } from "./types.ts"

  // The step: what `children`, a snippet given the step shown, draws of it.
  let { children, ...rest }: PopupProps<Step> = $props()
  const controller = useTour()
  const step = fromSignal(controller.shown)
  const index = fromSignal(controller.index)
  const current = fromSignal(controller.current)
  const total = fromSignal(controller.total)
  const shown = $derived({
    step: step.current as Step | undefined,
    index: index.current,
    current: current.current,
    total: total.current,
  })
</script>

<Part of={controller.popup} tag="div" {...rest}>{@render children?.(shown)}</Part>
