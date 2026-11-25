<script lang="ts">
  import Part from "../Part.svelte"
  import { useColorPicker } from "./context.ts"
  import type { AreaProps } from "./types.ts"

  let props: AreaProps = $props()
  const part = useColorPicker().area
</script>

<Part of={part} tag="div" {...props} />
