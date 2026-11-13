<script lang="ts">
  import Part from "../Part.svelte"
  import { useNavigation } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const made = useNavigation()
</script>

<Part part={made.backdrop} tag="div" {...props} />
