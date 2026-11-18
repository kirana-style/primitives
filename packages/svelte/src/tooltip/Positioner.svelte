<script lang="ts">
  import Placed from "../Positioner.svelte"
  import { useTooltip } from "./context.ts"
  import type { PositionerProps } from "./types.ts"

  let props: PositionerProps = $props()
  const controller = useTooltip()
</script>

<Placed placed={controller} {...props} />
