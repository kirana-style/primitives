<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createSteps } from "@kirana-ui/core/steps"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  // `bind:step` is the step shown, from 0.
  let { step = $bindable(), defaultStep, onStepChange, count, linear, orientation, id, ...rest }: RootProps = $props()
  const generated = $props.id()

  function change(next: number, by: ChangeDetails) {
    onStepChange?.(next, by)
    if (!by.canceled) step = next
  }

  const made = provide(
    controller(within(createSteps, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      step,
      defaultStep,
      count,
      linear,
      orientation,
      onStepChange: change,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
