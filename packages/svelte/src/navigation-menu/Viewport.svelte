<script lang="ts">
  import Part from "../Part.svelte"
  import { useNavigation } from "./context.ts"
  import type { ViewportProps } from "./types.ts"

  let props: ViewportProps = $props()
  const made = useNavigation()
</script>

<Part of={made.viewport} tag="div" {...props} />
