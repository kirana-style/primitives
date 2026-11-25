<script lang="ts">
  import Placed from "../Positioner.svelte"
  import { useTour } from "./context.ts"
  import type { PositionerProps } from "./types.ts"

  let props: PositionerProps = $props()
  const controller = useTour()
</script>

<Placed placed={controller} {...props} />
