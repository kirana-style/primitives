<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { useNumberField } from "./context.ts"
  import type { ScrubAreaProps } from "./types.ts"

  // Pressed and dragged to change the number.
  let { direction, pixelSensitivity, teleportDistance, ...rest }: ScrubAreaProps = $props()
  const controller = useNumberField()
  $effect.pre(() => {
    controller.scrub.set(defined({ direction, pixelSensitivity, teleportDistance }))
  })
</script>

<Part of={controller.scrubArea} tag="span" {...rest} />
