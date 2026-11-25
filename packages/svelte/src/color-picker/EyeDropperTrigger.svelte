<script lang="ts">
  import Part from "../Part.svelte"
  import { useColorPicker } from "./context.ts"
  import type { EyeDropperTriggerProps } from "./types.ts"

  let props: EyeDropperTriggerProps = $props()
  const part = useColorPicker().eyeDropperTrigger
</script>

<Part of={part} tag="button" {...props} />
