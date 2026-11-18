<script lang="ts">
  import Placed from "../Positioner.svelte"
  import { useCombobox } from "./context.ts"
  import type { PositionerProps } from "./types.ts"

  let props: PositionerProps = $props()
  const controller = useCombobox()
</script>

<Placed placed={controller} {...props} />
