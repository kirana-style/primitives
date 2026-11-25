<script lang="ts">
  import Part from "../Part.svelte"
  import { useColorPicker } from "./context.ts"
  import type { AreaThumbProps } from "./types.ts"

  let props: AreaThumbProps = $props()
  const part = useColorPicker().areaThumb
</script>

<Part of={part} tag="div" {...props} />
