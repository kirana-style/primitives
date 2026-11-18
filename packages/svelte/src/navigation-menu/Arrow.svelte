<script lang="ts">
  import Part from "../Part.svelte"
  import { useNavigation } from "./context.ts"
  import type { ArrowProps } from "./types.ts"

  let props: ArrowProps = $props()
  const made = useNavigation()
</script>

<Part of={made.arrow} tag="div" {...props} />
