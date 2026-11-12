<script lang="ts">
  import Part from "../Part.svelte"
  import { useProgress } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useProgress()
</script>

<Part part={controller.label} tag="span" {...props} />
