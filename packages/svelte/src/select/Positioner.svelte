<script lang="ts">
  import Placed from "../Positioner.svelte"
  import { useSelect } from "./context.ts"
  import type { PositionerProps } from "./types.ts"

  // `alignItemWithTrigger`: the list opens over its trigger, the chosen item's text on the
  // trigger's own, where there is room and unless a finger opened it. While it lies there the
  // page's scroll is held (its scrollbar's room kept), and a scroll of a box around the trigger
  // closes the list (`"ancestor-scroll"`), as a change of the window's size does
  // (`"window-resize"`).
  let { alignItemWithTrigger, ...props }: PositionerProps = $props()
  const controller = useSelect()
  // Before the element attaches: the first placement reads it.
  $effect.pre(() => {
    controller.alignItemWithTrigger.set(Boolean(alignItemWithTrigger))
  })
</script>

<Placed placed={controller} {...props} />
