<script lang="ts">
  import Part from "../Part.svelte"
  import { useToolbar } from "./context.ts"
  import type { LinkProps } from "./types.ts"

  let props: LinkProps = $props()
  const part = useToolbar().link()
</script>

<Part of={part} tag="a" {...props} />
