<script lang="ts">
  import Part from "../Part.svelte"
  import { useItem } from "./context.ts"
  import type { HeaderProps } from "./types.ts"

  let props: HeaderProps = $props()
  const part = useItem().header
</script>

<Part of={part} tag="h3" {...props} />
