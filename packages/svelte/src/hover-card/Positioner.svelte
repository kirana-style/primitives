<script lang="ts">
  import Placed from "../Positioner.svelte"
  import { useHoverCard } from "./context.ts"
  import type { PositionerProps } from "./types.ts"

  let props: PositionerProps = $props()
  const controller = useHoverCard()
</script>

<Placed placed={controller} {...props} />
