<script lang="ts">
  import Part from "../Part.svelte"
  import { useMonth } from "./context.ts"
  import type { GridProps } from "./types.ts"

  let props: GridProps = $props()
  const month = useMonth()
</script>

<Part of={month.grid} tag="table" {...props} />
