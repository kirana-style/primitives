<script lang="ts">
  import Part from "../Part.svelte"
  import { useHoverCard } from "./context.ts"

  let props = $props()
  const controller = useHoverCard()
</script>

<Part part={controller.trigger} tag="a" {...props} />
