<script lang="ts" generics="Step extends TourStep = TourStep">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createTour } from "@kirana-ui/core/tour"
  import type { Tour, TourStep } from "@kirana-ui/core/tour"

  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let {
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    step = $bindable(),
    defaultStep,
    onStepChange,
    steps,
    waitForTarget,
    spotlightPadding,
    closeOnOutsidePress,
    interactive,
    keyboardNavigation,
    id,
    children,
  }: RootProps<Step> = $props()
  const generated = $props.id()

  function toggle(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  function go(next: number, by: ChangeDetails) {
    onStepChange?.(next, by)
    if (!by.canceled) step = next
  }

  const made = controller(within(createTour<Step>, { direction: useDirectionAround() }), () => ({
    id: id ?? generated,
    steps,
    open,
    defaultOpen,
    onOpenChange: toggle,
    step,
    defaultStep,
    onStepChange: go,
    waitForTarget,
    spotlightPadding,
    closeOnOutsidePress,
    interactive,
    keyboardNavigation,
  }))
  provide(made as unknown as Tour)
</script>

{@render children?.()}
