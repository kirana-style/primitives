<script lang="ts">
  import Part from "../Part.svelte"
  import { useSwitch } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useSwitch()
</script>

<Part part={controller.thumb} tag="span" {...props} />
