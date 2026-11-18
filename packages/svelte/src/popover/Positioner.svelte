<script lang="ts">
  import Placed from "../Positioner.svelte"
  import { usePopover } from "./context.ts"
  import type { PositionerProps } from "./types.ts"

  let props: PositionerProps = $props()
  const controller = usePopover()
</script>

<Placed placed={controller} {...props} />
