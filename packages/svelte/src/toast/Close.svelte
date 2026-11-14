<script lang="ts">
  import Part from "../Part.svelte"
  import { useParts } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useParts()
</script>

<Part part={controller.close} tag="button" {...props} />
