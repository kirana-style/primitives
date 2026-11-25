<script lang="ts">
  import Part from "../Part.svelte"
  import { useTimeField } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let props: InputProps = $props()
  const controller = useTimeField()
</script>

<Part of={controller.input} tag="input" {...props} />
