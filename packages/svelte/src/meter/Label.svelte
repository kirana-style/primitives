<script lang="ts">
  import Part from "../Part.svelte"
  import { useMeter } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useMeter()
</script>

<Part part={controller.label} tag="span" {...props} />
