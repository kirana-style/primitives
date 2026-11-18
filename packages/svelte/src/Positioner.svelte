<script lang="ts">
  import type { Part as CorePart, PositionOptions, Signal } from "@kirana-ui/core"
  import { defined } from "@kirana-ui/core"

  import Part from "./Part.svelte"
  import type { PositionerProps } from "./types.ts"

  // A positioner: the part's element, with where it goes as props. The one place a positioner's
  // own props are named; `placed` is the controller it is a part of.
  let {
    placed,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    collisionBoundary,
    collisionAvoidance,
    sticky,
    arrowPadding,
    positionMethod,
    anchor,
    ...rest
  }: PositionerProps & {
    placed: { positioning: Signal<Partial<PositionOptions>>; positioner: CorePart }
  } = $props()
  // Before the element attaches: the first placement reads these.
  $effect.pre(() => {
    placed.positioning.set(
      defined({
        side,
        align,
        sideOffset,
        alignOffset,
        collisionPadding,
        collisionBoundary,
        collisionAvoidance,
        sticky,
        arrowPadding,
        positionMethod,
        // A function is asked here, so a change of the state it reads is followed; and given
        // whole while it has nothing, to be asked again as the popup is placed.
        anchor: typeof anchor === "function" ? (anchor() ?? anchor) : anchor,
      })
    )
  })
</script>

<Part of={placed.positioner} tag="div" {...rest} />
