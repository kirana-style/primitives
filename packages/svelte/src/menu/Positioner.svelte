<script lang="ts">
  import Placed from "../Positioner.svelte"
  import { useMenu } from "./context.ts"
  import type { PositionerProps } from "./types.ts"

  let props: PositionerProps = $props()
  const controller = useMenu()
</script>

<Placed placed={controller} {...props} />
