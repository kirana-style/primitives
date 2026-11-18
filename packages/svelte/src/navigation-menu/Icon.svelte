<script lang="ts">
  import Part from "../Part.svelte"
  import { useItem } from "./context.ts"
  import type { IconProps } from "./types.ts"

  let props: IconProps = $props()
  const made = useItem()
</script>

<Part of={made.icon} tag="span" {...props} />
