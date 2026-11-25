<script lang="ts">
  import Part from "../Part.svelte"
  import { useColorPicker } from "./context.ts"
  import type { SwatchProps } from "./types.ts"

  let props: SwatchProps = $props()
  const part = useColorPicker().swatch
</script>

<Part of={part} tag="div" {...props} />
