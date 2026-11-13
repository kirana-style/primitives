<script lang="ts">
  import Part from "../Part.svelte"
  import { useMenu } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useMenu()
</script>

<Part part={controller.trigger} tag="button" {...props} />
