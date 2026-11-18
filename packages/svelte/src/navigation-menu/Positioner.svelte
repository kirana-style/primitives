<script lang="ts">
  import Placed from "../Positioner.svelte"
  import { useNavigation } from "./context.ts"
  import type { PositionerProps } from "./types.ts"

  let props: PositionerProps = $props()
  const controller = useNavigation()
</script>

<Placed placed={controller} {...props} />
